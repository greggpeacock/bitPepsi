var WebSocket = require('ws');

var conn = new WebSocket("wss://ws.chain.com/v2/notifications");

var req = {type:"address",address:"1L29y3VNRcCQdqvXhV1Jw2ALRARJeDsjDD", block_chain:"bitcoin"};

console.log(req);

// open, activate the connection
conn.on('open', function () {        
    console.log('Websocket opened.');            
    conn.send(JSON.stringify(req), function ack(err) {
    });
});

conn.on('message', function (data, flags) {

    var response = JSON.parse(data);

    //console.log(response);

    if (response.payload.type == "new-transactions"){
        // event detected!
        console.log(response);

        // to which wallet?

        // does the amount align with the expected amount?

        // activate GPIO
        //energize(wallet.gpio)

    } else if (response.payload.type == "heartbeat") {
        console.log('tick tock');
        console.log(response);
    }  else {
        console.log(response);
    }   
});  