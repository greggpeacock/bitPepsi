'use strict';

var WebSocket = require('ws');
var Config = require('./config/bitPepsi.json')
var btcstats = require('btc-stats');
var btcprice = require('./lib/btcprice');
var moment = require('moment');
var gpio = require('pi-gpio'); // note, you must run this script on a raspberry pi for this to work!

/*

1. establish websocket connection
2. from config data, being monitoring bitcoin wallets
3. if a deposit is detected, check that it is the right amount. if it is, energize the GPIO for 3 seconds.

utility functions:
- energize gpio up/down
- gpio cycle test
- acquire live bitcoin price from bitstamp in USD


*/


// open connection(s)
var opensocket = function(wallet, ack) {
    // define address
    var req = {type: "address", address:wallet.pubkey, block_chain: "bitcoin"};
    //console.log(req);
    
    // open, activate the connection
    conn.on('open', function () {        
        logit('Websocket opened.');            
        conn.send(JSON.stringify(req), function (err) {
            if (err) {
                ack(new Error('Unable to connect to Websocket'));
            }
            else
            {
                logit("Connection successful.");
                watchwallet(wallet)
            }
        });
    });
    
    // connection errors
    conn.on('error',function (err) {
        if (err) ack(new Error('ERROR! Error detected: %s', error));
    });

    // re-connect
    conn.on('close',function (wallet) {
        logit("Connection lost. Reconnecting in 10 seconds....");
        setTimeout(opensocket(wallet),10000);
    });

}

var watchwallet = function(wallet) {
    logit("Watching address "+ wallet.pubkey +" for a deposit value of $" + wallet.itemcost);    
    // change detected
    conn.on('message', function (data, flags) {

        var activity = JSON.parse(data);

        if (activity.payload.type == "address" && activity.payload.received != 0){
            // event detected!
            logit('Event detected.');
            validateDeposit(wallet, activity, function(err,validation) {           
                logit(validation.msg);

                if(validation.val == true) {
                    //fire the GPIO!
                    energize(wallet.gpio,1,wallet.gpiocycletime, function() {
                        logit("GPIO "+wallet.gpio+" triggered for "+wallet.gpiocycletime+" ms");
                    })
                }
            });

        } else if (activity.payload.type == "heartbeat") {
            logit("Tick Tock. Current price: $"+currentPrice.val+" CAD. Last updated; " + currentPrice.updated);
        } else {
            logit('Other activity detected. Ignoring (likely a confirmation or a withdrawl).');
        }    
    });  
}

// returns boolean after checking the new activity.
var validateDeposit = function (wallet, activity, ack) {

    var response = {};
    response.val = true;

    if( activity.payload.confirmations != 0 ) {
        // this transaction is already confirmed
        response.val = false;
        response.msg = "Transaction is not new. "+activity.payload.confirmations+" confirmations exist.";
        ack(null,response);

    } else if( wallet.pubkey != activity.payload.address ) {
        // deposit address incorrect
        response.val = false;
        response.msg = "Transaction went to the wrong address. Expected: "+wallet.pubkey+" Received: " + activity.payload.address;
        ack(null,response);

    } else {
        // deposit amount incorrect
        marketPrice (function (err,data) {
            
            if(err) {
                response.val = false;
            }
            else
            {
                response.usd = data; // API price in USD
                response.received = activity.payload.received/100000000*data; // Amount detected, converted to USD
                response.expected = wallet.itemcost;

                //console.log("price: $%s; received: $%s; expected: $%s; tolerance: $%s",values.usd,values.received,values.expected,wallet.pricetolerance);

                if((response.expected - response.received) > wallet.pricetolerance) {
                    response.val = false;
                    response.msg = "Value was not the expected amount. Expected: $" + response.expected + " Received: $" + response.received;
                }
                else
                    response.msg = "Transaction is VALID.";
            }

            ack(err,response);
        });
    }    
}

var energize = function(pin,level,duration,ack) {
    gpio.open(pin, "output", function(err) {     // Open pin  output 
        
       if(err) {
            // likely what's happened here is that port is still open from a previous session. let's close it and recycle.
            gpio.close(pin, function(err) {  logit("We're having trouble closing the port.");});
       }

        gpio.write(pin,1, function high(err) { // 1=high 0=low
            setTimeout(function delaypin(err) {
                gpio.write(pin,0, function low(err) {
                    gpio.close(pin, function closepin(err) {
                        if (err) {
                            logit("There was an error closing the PIN.");
                        }
                        else
                        {
                            logit("Close successful.");
                        }
                    });
                });

            },duration); // how long in ms do we keep the GPIO 'high'

        });

        if( ack != undefined )
            ack()
    });    
}

var marketPrice = function(ack) {
    var price;
    btcstats.exchanges(["bitfinex", "bitstamp"]);    
    btcstats.avg(function(err, resp) {
        if (!err) {
            ack(null,resp.price);
        }
    }); 
} 

var logit = function(msg) {
    console.log('[' + moment().format() + '] :: ' + msg)
}

/*
======================================================
*/

var currentPrice = {};
btcprice.updatePrice(function(x) {
    currentPrice.val = x.last;
    currentPrice.updated = x.timestamp;
});

logit('Establising web socket...'); 
var conn = new WebSocket(Config.websocket);

opensocket(Config.wallets.wallet1, function(err) {
if (err != undefined )
    console.log(err);
});

