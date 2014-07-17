// TODO
// Get/set scratch data
// Serial read?

var util = require('util');
var events = require('events');
var serialLib = require('./serial');
var protocol = require('./protocol.json');

function Bean (device, callback) {
  var self = this;
  self.device = device;
  self.serial;
  self.device.discoverAllCharacteristics(function(err, characteristics){
    if (!err){
      self._saveCharacteristics(characteristics, function(err){callback(err, self)});
    } else {
      callback && callback(err);
    }
  });
}

util.inherits(Bean, events.EventEmitter);

Bean.prototype._saveCharacteristics = function (characteristics, callback) {
  var self = this;
  var chs = {};
  characteristics.forEach(function(ch){
    chs[ch.uuid.toString()] = ch;
  });
  self.characteristics = chs;
  self.serial = serialLib.use(
    self.characteristics['a495ff11c5b14b44b5121370f02d74de'], callback);
  self.serial.on('data', function(data){
    self.emit('data', data);
  });
  self.serial.on('temp', function(temp){
    self.emit('temp', temp);
  });
}

Bean.prototype.write = function (data, callback) {
  this.serial.write(data, callback);
}

Bean.prototype.read = function (callback) {

}

Bean.prototype.setLED = function (r, g, b, callback) {
  var buff = new Buffer([r&0xFF , g&0xFF, b&0xFF]);
  this.serial.sendMessage(protocol.MSG_ID_CC_LED_WRITE_ALL, buff, callback);
}

Bean.prototype.readLED = function () {
  this.serial.sendMessage(protocol.MSG_ID_CC_LED_READ_ALL, new Buffer(0));
}

Bean.prototype.readAccel = function () {
  this.serial.sendMessage(protocol.MSG_ID_CC_ACCEL_READ, new Buffer(0));
}

Bean.prototype.readTemp = function () {
  this.serial.sendMessage(protocol.MSG_ID_CC_TEMP_READ , new Buffer(0));
}

Bean.prototype.readMetaData = function () {
  this.serial.sendMessage(protocol.MSG_ID_BL_GET_META, new Buffer(0));
}

Bean.prototype.disconnect = function () {
  this.device.disconnect();
}

module.exports = Bean;
