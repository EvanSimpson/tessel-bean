var tessel = require('tessel');
var bleLib = require('ble-ble113a');
var BeanFinder = require('../');

bleLib.use(tessel.port['A'], function(err, ble){
  var finder = new BeanFinder(ble, function(err, bean){
    bean.on('data', function(data){
      console.log('Got data', data);
    });
    bean.on('temp', function(temp){
      console.log('Got temp', temp);
    });
    setInterval(function(){
      bean.write('Hey bean');
    }, 3000);
  });
});
