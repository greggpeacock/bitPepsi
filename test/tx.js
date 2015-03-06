var WebSocket = require('ws');
var assert = require('assert');

var conn = new WebSocket("wss://ws.chain.com/v2/notifications");
var req = {type:"address", address:"1L29y3VNRcCQdqvXhV1Jw2ALRARJeDsjDD", block_chain:"bitcoin"};
var x = require('../lib/btcprice');

describe("Info Fetch", function() {
    it("should fetch latest price", function(done) {
        x.getPrice(function(err, price) {
            assert(price);
            done(err);
        });
    });
})


describe("Transaction Verification", function() {

    it("should activate connection", function(done) {
        // open, activate the connection
        conn.on('open', function () {                  
            conn.send(JSON.stringify(req), done)
        });

    });

    it("should respond", function(done) {

        conn.on('message', function (data, flags) {
            var response = JSON.parse(data);

            if (response.payload.type == "new-transactions"){
                // event detected!
                console.log(response);

            } else if (response.payload.type == "heartbeat") {
                console.log('tick tock');
                console.log(response);
            }  else {
                console.log(response);
            }

            done()
        });

        conn.on('error', done);
    });
});
