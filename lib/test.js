var x = require('../lib/btcprice');

x.updatePrice(function(y) {
    console.log('price is: ' + y);
});