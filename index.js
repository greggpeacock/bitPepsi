'use strict';

var WebSocket = require('ws'); 
var Config = require('./config/bitpepsi.json') // JSON configuration file for the application
var merge = require('merge');
var btcprice = require('./lib/btcprice'); // realtime xbt market price in CAD
var logger = require('winston'); // file and console loggin
var argv = require('minimist')(process.argv.slice(2));
var async = require('async');

var conn;
var currentPrice = {val: 0, updated: 0};
var wallets = Config.wallets;

if(!argv.nogpio) var gpio = require('pi-gpio'); // you must run this script on a raspberry pi for this to work

/*

1. establish websocket connection
2. from config data, being monitoring bitcoin wallets
3. if a deposit is detected, check that it is the right amount. if it is, energize the GPIO for 3 seconds.

utility functions:
- energize gpio up/down
- gpio cycle test
- acquire live bitcoin price from bitstamp in USD

*/

// initiate logger
process.env.TZ = 'America/Vancouver'
logger.add(logger.transports.File, { 'filename': './log/bitpepsi.log','timestamp': function() {return new Date().toString();} });
if(!argv.debug) logger.remove(logger.transports.Console);

/*btcprice.updatePrice(function(x,results) {
    if( x == null ) {
        currentPrice.val = results.last;
        currentPrice.updated = results.timestamp
    }
}); */

start();

/*logger.info('Establising web socket...'); 
conn = new WebSocket(Config.websocket);
// watch all wallets in the config file
async.each(wallets, viewWallet, function(err) { logger.error(err) }); */

/* ============= */

function start() {
    async.parallel([         
        updateMarketPrice,
        establishWs
    ], function(err) { 
        logger.error(err.message);
        logger.info("Exiting in 3 seconds....");
        setInterval(function() {
            logger.info('Bye!!');
            process.exit(1);
        },3000);
     })

}

function updateMarketPrice(done,results) {
    
    btcprice.updatePrice(function(err,results) {
        if( !err ) {
            currentPrice.val = results.last;
            currentPrice.updated = results.timestamp
        } else {
            done(err);
        }
    });
}

function establishWs(done,results) {
    logger.info('Establishing web socket...'); 
    conn = new WebSocket(Config.websocket);
    
    // watch all wallets in the config file
    async.each(wallets, viewWallet, done);   
}

// Start Wallet Check - note, order of parameters is different here due to async.each called earlier.
function viewWallet(wallet, done) {

    async.auto({
        wallet: function(done){done(null, wallet)}, // draws the wallet config details into async
        open: ['wallet', opensocket],
        watch: ['open', watchwallet]
    }, done)
};

// open connection(s)
function opensocket(done, results) {

    // wallet configuration details
    var wallet = results.wallet 
    // define address
    var req = {type: "address", address:wallet.pubkey, block_chain: "bitcoin"};   
    // open, activate the connection
    conn.on('open', function () {        
        logger.info('Websocket opened.');            
        conn.send(JSON.stringify(req), function (err) {
            if (err) {
                done(new Error('Unable to connect to Websocket'));
            } else {
                logger.info("Connection successful.");
                done();
            }
        });
    });
    
    // connection errors
    conn.on('error', function() {
        done(new Error("Unknown websocket error."));
    })

    // re-connect
    // this is NOT TESTED.
    conn.on('close',function () { //wallets
        done(new Error("Websocket broken."));
    });

}

function watchwallet(done, results) {
    var wallet = results.wallet; // wallet{} and open{}

    logger.info("Watching address "+ wallet.pubkey +" for a deposit value of $" + wallet.itemcost);    

    // this stays active and waits for a deposit
    conn.on('message', function (data, flags) {

        var activity = JSON.parse(data); // parse the websocket reponse
        //console.log(activity);

        if (activity.payload.type == "address" && activity.payload.received != 0) {
            
            results = merge(results,activity);
            validateDeposit(done,results);

        } else if (activity.payload.type == "heartbeat") {
            logger.debug("Tick Tock. Current price: $"+currentPrice.val+" CAD. Last updated: " + currentPrice.updated);
        }   
    });  
}

function validateDeposit(done, results) {

    var response = {};
    var wallet = results.wallet;
    var activity = results.payload;


    if( wallet.pubkey == activity.address ) {
        if( activity.confirmations != 0 ) {
            // this transaction is already confirmed
            logger.error("Transaction is not new. "+activity.confirmations+" confirmations exist.");
        } else {
            logger.info('Validating deposit..');
            response.usd = currentPrice.val; // API price in CAD
            response.received = activity.received/100000000*currentPrice.val; // Amount detected, converted to CAD
            response.expected = wallet.itemcost;
            logger.info("price: $%s; received: $%s; expected: $%s; tolerance: $%s",response.usd,response.received,response.expected,wallet.pricetolerance);

            if((response.expected - response.received) > wallet.pricetolerance) {
                logger.error("Value was not the expected amount. Expected: $" + response.expected + " Received: $" + response.received);
            } else {
                logger.info("#####################");
                logger.info("Transaction is VALID.");
                logger.info("#####################");
                energize(done,wallet);
            }
        }
    }
}

// GPIO controls for the Raspberry Pi Controller
function energize(done, results) {
    var pin = results.gpio;
    var duration = results.gpiocycletime;

    if(!argv.nogpio) {
        gpio.open(pin, "output", function(err) {     // Open pin  output 
            
           if(err) {
                // likely what's happened here is that port is still open from a previous session. let's close it and recycle.
                gpio.close(pin, function(err) { 
                    done(new Error("We're having trouble closing the GPIO.", err))
                });
           }

            gpio.write(pin,1, function high(err) { // 1=high 0=low
                logger.info("GPIO "+pin+" triggered for "+duration+" ms");
                setTimeout(function delaypin(err) {
                    gpio.write(pin,0, function low(err) {
                        if(err) done(err);
                        gpio.close(pin, function closepin(err) {
                            if (err) {
                                done(new Error("There was an error closing the GPIO."));
                            } else {
                                logger.info("GPIO close successful.");
                                done();
                            }
                        });

                    }); // how long in ms do we keep the GPIO 'high'

                },duration);

            });
        });
    } else {
        logger.info('Bypassing GPIO energize due to testing parameters.');
        done();
    }
}
