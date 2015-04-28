var https = require ('https')

var updatedPrice = 0.00;
var options = {
    'hostname' : 'api.bitcoinaverage.com',
    'port' : 443,
    'path' : '/ticker/global/CAD/',
    'method' : 'GET' 
}

// query the API and get the CAD price.
function getPrice(done) {

    var reqGet = https.get(options, function(res) {
        var buffer = '';

        res.on('data', function(d) {
            buffer += d.toString();        
        });

        res.on('end', function() {
            results = JSON.parse(buffer);           
            done(null, results);  
        });

    });

    reqGet.end();
    reqGet.on('error', function() {
        done(new Error(),null);
    });
}

// update the price on a regular interval
function updatePrice(done) {
    // run once immediately
    getPrice(done);

    // update it regularly
    setInterval(function() {
        getPrice(done)
    },120000);
}

module.exports.getPrice = getPrice;
module.exports.updatePrice = updatePrice;



