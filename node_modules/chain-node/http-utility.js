var request = require('request');
var fs = require('fs');
var path = require('path');
var util = require('util');

var URL = 'https://api.chain.com';
var PEM = fs.readFileSync(path.join(__dirname, './chain.pem'));

module.exports = HttpUtility;

function HttpUtility(c) {
  if(c.auth == null) {
    c.auth = "GUEST-TOKEN";
  };
  this.auth = c.auth;

  if (c.url == null) {
    c.url = URL;
  };
  this.url = c.url;
}

HttpUtility.prototype.makeRequest = function(method, path, body,  cb) {
  var usingJson = false;
  var r = {
    strictSSL: true,
    cert: PEM,
    auth: this.auth,
    method: method,
    uri: this.url + path
  };
  if(body != null) {
    usingJson = true;
    r['json'] = body;
  }
  request(r, function(err, msg, resp) {
    if(usingJson) {
      cb(err, resp);
    } else {
      cb(err, JSON.parse(resp));
    }
  });
};

HttpUtility.prototype.post = function(path, body, cb) {
  this.makeRequest('POST', path, body, cb);
};

HttpUtility.prototype.delete = function(path, cb) {
  this.makeRequest('DELETE', path, null, cb);
};

HttpUtility.prototype.get = function(path, cb) {
  this.makeRequest('GET', path, null, cb);
}
