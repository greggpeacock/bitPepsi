'use strict';

var WebSocket = require('ws');
var Config = require('./config/bitPepsi.json')
var btcstats = require("btc-stats");
//var gpio = require('pi-gpio');

// establish Websocket connection
console.log('Establising web socket...');
var conn = new WebSocket("wss://ws.chain.com/v2/notifications");

// open Websockets for monitoring
for( var wallet in Config.wallets ) {
    //openConnection(Config.wallets[wallet],watchConnection);
}

//
//
//

function openConnection(wallet, callback) {

    var req = {type: "address", address:wallet.pubkey, block_chain: "bitcoin"};
    //console.log(wallet.pubkey);

    // open, activate the connection
    conn.on('open', function (ev) {
        console.log('Websocket opened.');       
        
        conn.send(JSON.stringify(req), function ack(error) {
            if (error != undefined) {
                console.log("Request not sent: %s", error);
            } else {
                console.log("Watching address %s for a deposit value of $%s", wallet.pubkey, wallet.itemcost);
            }

            callback()
        });
    });   
}

function watchConnection() {

    conn.on('error',function (error) {
        console.log ('ERROR! Error detected: %s', error);
    });

    conn.on('close', function (close) {
        console.log ('Socket closed.')
    });

    // change detected
    conn.on('message', function (data, flags) {
        if (data.payload.type = "new-transactions"){
            // event detected!
            console.log(data);

            // to which wallet?

            // does the amount align with the expected amount?

            // activate GPIO
            gpio.open(16, "output", function(err) {     // Open pin  output 
                gpio.write(16, 1, function() {          // Set pin  high (1) 
                    gpio.close(16);                     // Close pin 
                });
            });

        } else if (data.payload.type = "heartbeat") {
            return;
        }     
    });  
}

function energize(pin) {
    gpio.open(pin, "output", function(err) {     // Open pin  output 
        gpio.write(pin, 1, function() {          // Set pin  high (1) 
            gpio.close(pin);                     // Close pin 
        });
    });    
}

function marketPrice(callback) {

    btcstats.exchanges(["bitfinex", "bitstamp"]);
    
    btcstats.avg(function(error, resp) {
        logit(resp.price);
    }); 
}



//console.log("Current market price is: $%s", marketPrice());
//var currentPrice = marketPrice();
function logit(x) {
    console.log("test: %s", x);
}

marketPrice(logit);
