var serial = require('../lib/serial').use();

function testParseMessage(){}

function testSendMessage(){}

function testCreateMessage(){
  var hello = 'Hello, Bean!';
  var packet = new Buffer(2 + hello.length);
  packet.writeUInt16BE(0x0f00, 0);
  packet.write(hello, 2);
  var message = serial._createMessage(packet);
  console.log(message);
}

function testComputeCRC16(){
  var crc = serial._computeCRC16(0xffff, [0x04, 0x00], 0, 2);
  console.log(crc);
}

function testPacketize(){
  var hello = 'Hello, Bean! This is Tessel.';
  var packet = new Buffer(2 + hello.length);
  packet.writeUInt16BE(0x0f00, 0);
  packet.write(hello, 2);
  var message = serial._createMessage(packet);
  var packets = serial._packetize(message);
  console.log(packets);
}

function runTests(){
  console.log('1..1');

  testComputeCRC16();
  testCreateMessage();
  testPacketize();
}

runTests();
