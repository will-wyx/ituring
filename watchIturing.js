/**
 * Created by WILL on 2016/8/17.
 */
var http = require('http');
var querystring = require('querystring');
var jsdom = require('jsdom');

var generalProxy = {
    ipVal: '127.0.0.1',
    portVal: 7777,
    get ip() {
        return this.ipVal;
    },
    set setip(val) {
        this.ipVal = val;
    },
    get port() {
        return this.portVal;
    },
    set setport(val) {
        this.portVal = val;
    }
};
var randomProxy = {
    ipVal: '127.0.0.1',
    portVal: 7777,
    get ip() {
        return this.ipVal;
    },
    set setip(val) {
        this.ipVal = val;
    },
    get port() {
        return this.portVal;
    },
    set setport(val) {
        this.portVal = val;
    }
};

var getlogon = function (options) {
    http.request({
        host: generalProxy.ip,
        port: generalProxy.port,
        path: 'http://www.ituring.com.cn/account/logon',
        method: 'GET'
    }, function (res) {
        res.setEncoding('utf8');
        var html = '';

        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            options.callback({
                html: html,
                cookie: res.headers['set-cookie']
            });
        });
    })
        .on('error', function (err) {
            console.log(err);
        })
        .end();
};

var postlogon = function (options) {
    var req = http.request({
        host: generalProxy.ip,
        port: generalProxy.port,
        path: 'http://www.ituring.com.cn/account/logon',
        method: 'POST',
        headers: {
            "content-type": "application/x-www-form-urlencoded",
            "cookie": options.cookie
        }
    }, function (res) {
        res.setEncoding('utf8');
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            options.callback(res.headers['set-cookie']);
        });
    })
        .on('error', function (err) {
            console.log(err);
        })
        .write(querystring.stringify({
            __RequestVerificationToken: options.token,
            UserName: 'will_wyx',
            Password: '******',
            RememberMe: true
        }));
    req.end();
};

var getuser = function (options) {
    http.request({
        host: options.proxy.ip,
        port: options.proxy.port,
        path: 'http://www.ituring.com.cn/users/' + options.uid,
        method: 'GET',
        headers: {
            "cookie": options.cookie
        }
    }, function (res) {
        res.setEncoding('utf8');
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            options.callback(html, options.uid);
        });
    })
        .on('error', function () {
            if (options.count < 10) {
                console.log('errorgetuser ' + options.count++);
                getuser(options);
            } else {
                console.log('getuser ' + options.uid);
            }
        })
        .end();
};

var postfollow = function (options) {
    http.request({
        host: options.proxy.ip,
        port: options.proxy.port,
        path: 'http://www.ituring.com.cn/users/follow/' + options.uid,
        method: 'POST',
        headers: {
            "cookie": options.cookie
        }
    }, function (res) {
        res.setEncoding('utf8');
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            options.callback(html);
        });
    })
        .on('error', function () {
            if (options.count < 10) {
                console.log('errorfollow ' + options.count++);
                postfollow(options);
            } else {
                console.log('postfollow ' + options.uid);
            }
        })
        .end();
};
exports.follow = function (options) {
    var auth = '';

    var getuserCallback = function (html, uid) {
        var reg = new RegExp('<a data-ajax="true" data-ajax-method="post" data-ajax-mode="replace" data-ajax-update="#follow-' + uid + '" href="/users/follow/' + uid + '">加关注</a>')
        jsdom.env(html, [], function (error, window) {
            if (!error) {
                var element = window.document.getElementById('follow-' + uid);
                if (element) {
                    var follow = element.innerHTML;
                    if (reg.test(follow)) {
                        // 加关注
                        postfollow({
                            uid: uid,
                            cookie: '.AUTH=' + auth + ';',
                            count: 0,
                            callback: function () {
                                console.log('success ' + uid);
                            }
                        });
                    } else {
                        console.log(uid);
                    }
                }
            }
        });
    };

    var postlogonCallback = function (result) {
        var reg = /\.AUTH=(\w+);/;
        // 登录成功COOKIE
        for (var i in result) {
            var item = result[i];
            var regres = reg.exec(item);
            if (regres) {
                auth = (regres[1]);
            }
        }
        for (var uid = options.startIndex; uid < options.endIndex; ++uid) {
            getuser({
                proxy: {ip: '', port: 0},
                cookie: '.AUTH=' + auth + ';',
                uid: uid,
                count: 0,
                callback: getuserCallback
            })
        }
    };

    var getlogonCallback = function (result) {
        jsdom.env(result.html, [], function (err, window) {
            if (!err) {
                var token = window.document.getElementsByName('__RequestVerificationToken')[0].value;
                var cookie = result.cookie;
                postlogon({
                    token: token,
                    cookie: cookie,
                    callback: postlogonCallback
                });
            }
        });
    };

    getlogon({callback: getlogonCallback});
};