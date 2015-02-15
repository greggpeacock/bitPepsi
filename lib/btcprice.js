var https = require ('https')
    ,options = {
        'hostname' : 'api.bitcoinaverage.com',
        'port' : 443,
        'path' : '/ticker/global/CAD/',
        'method' : 'GET' }
    ,updatedPrice = 0.00;


// query the API and get the CAD price.
var getPrice = function(ack) {
    var reqGet = https.get(options, function(res) {
        var buffer = '';

        res.on('data', function(d) {
            buffer += d.toString();        
        });

        res.on('end', function() {
            results = JSON.parse(buffer);
            ack(results);  
        });

    });

    reqGet.end();
    reqGet.on('error', function(e) {
        console.error(e)
    });
}

// update the price on a regular interval
var updatePrice = function(ack) {
    // update it regularly
    setInterval(function() {
        getPrice(function(x) {
            // return the price
            ack(x);
        })
    },120000);
}

module.exports.getPrice = getPrice;
module.exports.updatePrice = updatePrice;



