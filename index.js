'use strict';

var Chain = require('chain-node');
var WebSocket = require('ws');
var config = require('./config/bitPepsi.json')

var wallet1 = config.wallets.wallet1.pubkey
console.log ('we are going to watch public key: %s',wallet1)

// establish Websocket connection
var conn = new WebSocket("wss://ws.chain.com/v2/notifications");
//var conn = new WebSocket("wss://ws.blockchain.info/inv");

// monitor address for changes
conn.on('open', function (ev) {
    console.log('ws connected.');
    var req = {type: "address", address:config.wallets.wallet1.pubkey, block_chain: "bitcoin"};
    
    conn.send(JSON.stringify(req), function ack(error) {
        if (error != undefined) 
            console.log('error: request not sent: %s',error);
        });
});

conn.on('error',function (error) {
    console.log ('error detected: %s', error);
});

conn.on('close', function (close) {
    console.og ('socket closed.')
});

// change detected.
conn.on('message', function (data, flags) {
    console.log(data);
});
