// TODO
// Register callbacks for responses
// Implement more of the protocol
// Handle multi-part responses
// Validate responses (CRC)

var util = require('util');
var events = require('events');
var protocol = require('./protocol.json');

function Serial (characteristic, callback){
  this.bleAttr = characteristic;
  this._setUpNotifications(callback);
}

util.inherits(Serial, events.EventEmitter);

Serial.prototype._setUpNotifications = function(callback) {
  var self = this;

  self.bleAttr.notify(true, function(err){
    callback && callback(err);
  });
  self.bleAttr.on('notification', function(data){
    self.parseMessage(data);
  });
}

Serial.prototype.parseMessage = function (buffer, callback) {
  var self = this;

  var firstPacket = (buffer[0] & 0x80) == 0x80;
  var messageCount = (((buffer[0] & 0x60) >> 5));
  var pendingCount = (buffer[0] & 0x1f);
  var length = buffer[1];

  var type = ( (buffer.readUInt16BE(3) & 0xffff) & ~(protocol.APP_MSG_RESPONSE_BIT) );
  switch (type) {
    case protocol.MSG_ID_SERIAL_DATA:
        self._handleSerial(buffer.slice(5, -2));
        break;
    case protocol.MSG_ID_BT_GET_CONFIG:
        //
        break;
    case protocol.MSG_ID_CC_TEMP_READ:
        self._handleTemp(buffer[5]);
        break;
    case protocol.MSG_ID_BL_GET_META:
        //
        break;
    case protocol.MSG_ID_BT_GET_SCRATCH:
        //
        break;
    case protocol.MSG_ID_CC_LED_READ_ALL:
        self._handleLED([buffer[5], buffer[6], buffer[7]]);
        break;
    case protocol.MSG_ID_CC_ACCEL_READ:
        self._handleAccel({
            x : buffer.readUInt8(5) * 0.00391,
            y : buffer.readUInt8(6) * 0.00391,
            z : buffer.readUInt8(7) * 0.00391
          });
        break;
    default:
        //
        break;
  }
}

Serial.prototype._handleSerial = function (data) {
  this.emit('data', data);
}

Serial.prototype._handleConfig = function (config) {
  this.emit('config', config);
}

Serial.prototype._handleTemp = function (temp) {
  this.emit('temp', temp);
}

Serial.prototype._handleMeta = function (data) {
  this.emit('metaData', data);
}

Serial.prototype._handleScratch = function (data) {
  this.emit('scratchData', data);
}

Serial.prototype._handleLED = function (leds) {
  this.emit('led', leds);
}

Serial.prototype._handleAccel = function (accel) {
  this.emit('accel', accel);
}

Serial.prototype.sendMessage = function (type, data, callback) {
  var payload = new Buffer(2 + data.length);

  payload.writeUInt16BE(type, 0);
  payload.write(data, 2);
  var message = this._createMessage(payload);
  var packets = this._packetize(message);

  for (var i=0; i<packets.length; i++){
    this.bleAttr.write(packets[i]);
  }
  callback && callback();

}

Serial.prototype._createMessage = function (payload) {
  var packet = new Buffer(4 + payload.length);
  var header = [];
  header[0] = payload.length & 0xff;
  header[1] = 0;
  var crc = this._computeCRC16(0xff, header, 0, header.length);
  crc = this._computeCRC16(crc, payload, 0, payload.length);
  packet.writeUInt8(header[0], 0);
  packet.writeUInt8(header[1], 1);
  packet.write(payload.toString(), 2);
  packet.writeUInt8(crc & 0xff, payload.length + 2);
  packet.writeUInt8((crc >> 8) & 0xff, payload.length + 3);
  return packet;
}

Serial.prototype._packetize = function (message) {
  var packets = [];
  var count = Math.ceil(message.length / 19);
  for (var i=0; i < count; i++){
    var pre = ( i ? 0x00 : 0x80 ) | (i&0x3)<<5 | count-i;
    var dataSlice = message.slice( i*19,
      ( (i+1)*19 > message.length ? message.length : (i+1)*19 ) );
    var packet = Buffer.concat([new Buffer([pre]), dataSlice]);
    packets.push(packet);
  }
  return packets
}

Serial.prototype._computeCRC16 = function (startingCrc, data, offset, length) {

    var crc = (startingCrc & 0xffff);

    for (var i = offset; i < offset + length; i++) {
        crc = ((crc >> 8) & 0xffff) | ((crc << 8) & 0xffff);
        crc ^= data[i] & 0xff;
        crc &= 0xffff;
        crc ^= ((crc & 0xff) >> 4);
        crc &= 0xffff;
        crc ^= (crc << 8) << 4;
        crc &= 0xffff;
        crc ^= ((crc & 0xff) << 4) << 1;
        crc &= 0xffff;
    }

    return crc & 0xffff;
}

Serial.prototype.write = function (data, callback) {
  this.sendMessage(protocol.MSG_ID_SERIAL_DATA, data, callback);
}

function use(characteristic, callback){
  return new Serial(characteristic, callback);
}

module.exports.serial = Serial;
module.exports.use = use;
