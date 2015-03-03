'use strict';

var WebSocket = require('ws'); 
var Config = require('./config/bitPepsi.json') // JSON configuration file for the application
//var btcstats = require('btc-stats'); // retired
var btcprice = require('./lib/btcprice'); // realtime xbt market price in CAD
var logger = require('winston'); // file and console loggin
var gpio = require('pi-gpio'); // note, you must run this script on a raspberry pi for this to work!

var async = require('async');

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
logger.add(logger.transports.File, { filename: './log/bitpepsi.log' });
if(!(Config.debug != 'true' || process.argv[3] == 'debug')) logger.remove(logger.transports.Console);

// get xbt market price,keep updating it.
var currentPrice = {};
btcprice.updatePrice(function(x,results) {
    currentPrice.val = results.last;
    currentPrice.updated = results.timestamp;
});

logger.info('Establising web socket...'); 
var conn = new WebSocket(Config.websocket);
var x = Config.wallets;

// watch all wallets in the config file
async.each(x, viewWallet, console.error);

/* ============= */

// Start Wallet Check
function viewWallet(wallet, done) {

    async.auto({
        wallet: function(done){done(null, wallet)}, // dont understand this
        open: ['wallet', opensocket],
        watch: ['open', watchwallet]
    }, done)
};

// open connection(s)
function opensocket(done, results) {

    var wallet = results.wallet
    // define address
    var req = {type: "address", address:wallet.pubkey, block_chain: "bitcoin"};
    console.log(req);
    
    // open, activate the connection
    conn.on('open', function () {        
        logger.info('Websocket opened.');            
        conn.send(JSON.stringify(req), function (err) {
            if (err) {
                done(new Error('Unable to connect to Websocket'));
            }
            else
            {
                logger.info("Connection successful.");
                done();
            }
        });
    });
    
    // connection errors
    conn.on('error', done)

    // re-connect
    // this is NOT TESTED.
    conn.on('close',function (wallet) {
        logger.info("Connection lost. Reconnecting in 10 seconds....");
        setTimeout(opensocket(wallet, done),10000);
    });

}

function watchwallet(done, results) {
    var wallet = results.wallet;

    logger.info("Watching address "+ wallet.pubkey +" for a deposit value of $" + wallet.itemcost);    

    // this stays active and waits for a deposit
    conn.on('message', function (data, flags) {

        var activity = JSON.parse(data); // parse the websocket reponse
        //console.log(activity);

        if (activity.payload.type == "address" && activity.payload.received != 0){
            
            console.log('validating deposit..');
            //done(null, activity)

            /*this sections needs to be completed. the parent function conn.on must stay active continuously; the validate/energize functions
            must trigger and close each time conn.on is triggered. */
            async.auto({
                deposit: function(done){done(null, wallet)},
                validate: ['deposit', validateDeposit],
                energize: ['validate', energize]
            }, done)            

        } else if (activity.payload.type == "heartbeat") {
            //logger.info("Tick Tock. Current price: $"+currentPrice.val+" CAD. Last updated: " + currentPrice.updated);
        } else {
            logger.info('Other activity detected. Ignoring (likely a confirmation or a withdrawl).');
        }    
    });  
}

function validateDeposit(done, results) {

    var response = {};
    var wallet = results.wallet;
    var activity = results.watch

    if( wallet.pubkey == activity.payload.address ) {
        if( activity.payload.confirmations != 0 ) {
            // this transaction is already confirmed
            done(new Error("Transaction is not new. "+activity.payload.confirmations+" confirmations exist."));
        } else {
            response.usd = currentPrice.val; // API price in CAD
            response.received = activity.payload.received/100000000*currentPrice.val; // Amount detected, converted to CAD
            response.expected = wallet.itemcost;
            //console.log("price: $%s; received: $%s; expected: $%s; tolerance: $%s",values.usd,values.received,values.expected,wallet.pricetolerance);

            if((response.expected - response.received) > wallet.pricetolerance) {
                done(new Error("Value was not the expected amount. Expected: $" + response.expected + " Received: $" + response.received))
            } else {
                logger.info("Transaction is VALID.");
                done(null, wallet);
            }
        }
    } else {
        done(new Error("Wallet Key and Activity Address do not match."))
    }
}

// GPIO controls for the Raspberry Pi Controller
function energize(done, results) {
    var pin = results.validate.gpio;
    var duration = results.validate.gpiocycletime;

    //console.log(results);

    logger.info("GPIO "+pin+" triggered for "+duration+" ms");

    gpio.open(pin, "output", function(err) {     // Open pin  output 
        
       if(err) {
            // likely what's happened here is that port is still open from a previous session. let's close it and recycle.
            gpio.close(pin, function(err) { 
                done(new Error("We're having trouble closing the port.", err))
            });
       }

        gpio.write(pin,1, function high(err) { // 1=high 0=low
            setTimeout(function delaypin(err) {
                gpio.write(pin,0, function low(err) {
                    if(err) done(err);
                    gpio.close(pin, function closepin(err) {
                        if (err) {
                            done(new Error("There was an error closing the PIN."));
                        }
                        else
                        {
                            logger.info("Close successful.");
                            done()
                        }
                    });
                });

            },duration); // how long in ms do we keep the GPIO 'high'

        });

    });    
}