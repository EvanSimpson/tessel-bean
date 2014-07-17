// TODO Tests for all files
var tessel = require('tessel');
var bleLib = require('ble-ble113a');
var serialLib = require('./lib/serial');
var Bean = require('./lib/bean')

var bean;
var serialService = 'a495ff10c5b14b44b5121370f02d74de';


function BeanFinder(ble, callback) {
  var self = this;

  this.ble = ble;

  this._findBean();

  this.ble.on( 'discover', function(peripheral){
    self._connectToBean(peripheral);
  });

  this.ble.on( 'connect', function(peripheral){
    new Bean(peripheral, callback);
  });
}

BeanFinder.prototype._findBean = function () {
  this.ble.startScanning({
    allowDuplicates : false,
    serviceUUIDs : [serialService]
  });
}

BeanFinder.prototype._connectToBean = function (bean) {
  bean.connect();
}

module.exports = BeanFinder;
