var express = require('express');
var http = require('http');
var querystring = require('querystring');
var jsdom = require('jsdom');


var app = express();
app.use(express.static('views'));
var host = 'www.ituring.com.cn';
app.get('/logon', function (request, response) {
    var path = '/account/logon';
    var getlogon = function () {
        var req = http.request({
            host: host,
            path: path,
            method: 'GET'
        }, function (res) {
            res.setEncoding('utf8');
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                jsdom.env(html, [], function (err, window) {
                    var result = 'error';
                    if(!err)
                        result = window.document.getElementsByName('__RequestVerificationToken')[0].value;
                    response.send(result);
                });
            });
        });
        req.end();
    };
    var postlogon = function () {
        (function () {
            var req = http.request({
                host: host,
                path: path,
                method: 'POST'
            }, function (res) {
                res.setEncoding('utf8');
                res.on('data', function (data) {
                    console.log(data);
                });
            });
            req.write(querystring.stringify({
                UserName: 'will_wyx',
                Password: '900829'
            }));
            req.end();
        })();
    };
    getlogon();
});

app.listen(3000);