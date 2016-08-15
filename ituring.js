var express = require('express');
var http = require('http');
var querystring = require('querystring');
var jsdom = require('jsdom');


var app = express();
app.use(express.static('views'));
var host = 'www.ituring.com.cn';
app.get('/logon', function (request, response) {
    var path = '/account/logon';

    /**
     * 请求token
     * @param callback
     */
    var getlogon = function (callback) {
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
                callback({
                    html: html,
                    cookie: res.headers['set-cookie']
                });
            });
        });
        req.end();
    };

    /**
     * 请求登录
     * @param token
     * @param callback
     */
    var postlogon = function (paras, callback) {
        var req = http.request({
            host: host,
            path: path,
            method: 'POST',
            headers: {
                "content-type": "application/x-www-form-urlencoded",
                "cookie": paras.cookie
            }
        }, function (res) {
            res.setEncoding('utf8');
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                callback(res.headers['set-cookie']);
            });
        });
        req.write(querystring.stringify({
            __RequestVerificationToken: paras.token,
            UserName: 'will_wyx',
            Password: '900829',
            RememberMe: true
        }));
        req.end();
    };

    var getuser = function (paras, callback, count) {
        var req = http.request({
            host: host,
            path: '/users/' + paras.id,
            method: 'GET',
            headers: {
                "cookie": paras.cookie
            }
        }, function (res) {
            res.setEncoding('utf8');
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                callback(html, paras.id);
            });
        });
        req.on('error', function(){
            if(count < 10) {
                console.log('error ' + count++);
                getuser(paras, callback, count);
            } else {
                console.log('getuser ' + paras.id);
            }
        });
        req.end();
    };

    var postfollow = function (paras, callback) {
        var req = http.request({
            host: host,
            path: '/users/follow/' + paras.id,
            method: 'POST',
            headers: {
                "cookie": paras.cookie
            }
        }, function (res) {
            res.setEncoding('utf8');
            var html = '';
            res.on('data', function (data) {
                html += data;
            });
            res.on('end', function () {
                callback(html);
            });
        });
        req.on('error', function(){
            console.log('postfollow ' + paras.id);
        });
        req.end();
    };

    getlogon(function (paras) {
        jsdom.env(paras.html, [], function (err, window) {
            if (!err) {
                var token = window.document.getElementsByName('__RequestVerificationToken')[0].value;
                var cookie = paras.cookie;
                postlogon({
                    token: token,
                    cookie: cookie
                }, function (result) {
                    var reg = /\.AUTH=(\w+);/;
                    // 登录成功COOKIE
                    var auth = '';
                    for (var i in result) {
                        var item = result[i];
                        var regres = reg.exec(item);
                        if (regres) {
                            auth = (regres[1]);
                        }
                    }
                    for (var uid = 4000; uid < 4500; ++uid) {
                        getuser({
                            id: uid,
                            cookie: '.AUTH=' + auth + ';'
                        }, function (userhtml, uid) {
                            var reg = new RegExp('<a data-ajax="true" data-ajax-method="post" data-ajax-mode="replace" data-ajax-update="#follow-' + uid + '" href="/users/follow/' + uid + '">加关注</a>')
                            jsdom.env(userhtml, [], function (error, window) {
                                if (!error) {
                                    var element = window.document.getElementById('follow-' + uid);
                                    if (element) {
                                        var follow = element.innerHTML;
                                        if (reg.test(follow)) {
                                            // 加关注
                                            postfollow({
                                                id: uid,
                                                cookie: '.AUTH=' + auth + ';'
                                            }, function (followres) {
                                                console.log('followres ' + uid);
                                            });
                                        } else {
                                            console.log(uid);
                                        }
                                    }
                                }
                            });
                        }, 0);
                    }
                    response.send('followd');

                });
            }
        });
    });
});
app.listen(3000);