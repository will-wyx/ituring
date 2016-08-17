/**
 * Created by WILL on 2016/8/17.
 */
var http = require('http');
var jsdom = require('jsdom');

var getnt = function (options) {
    http.request({
        host: 'www.xicidaili.com',
        path: '/nt/' + options.page,
        method: 'GET',
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
        }
    }, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            options.callback(html);
        });
    }).on('error', function (err) {
        console.log(err);
    }).end();
};

var getnn = function (options) {
    http.request({
        host: 'www.xicidaili.com',
        path: '/nn/' + options.page,
        method: 'GET',
        headers: {
            "user-agent": "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/52.0.2743.116 Safari/537.36"
        }
    }, function (res) {
        var html = '';
        res.on('data', function (data) {
            html += data;
        });
        res.on('end', function () {
            options.callback(html);
        });
    }).on('error', function (err) {
        console.log(err);
    }).end();
};

var domproxies = function (pagelength, callback) {
    var proxyPages = [];
    for (var page = 1; page <= pagelength; ++page) {
        getnt({
            page: page,
            callback: function (html) {
                jsdom.env(html, [], function (error, window) {
                    if (!error) {
                        var table = window.document.getElementById('ip_list');
                        var rows = table.getElementsByTagName('tr');
                        var proxies = [];
                        for (var i = 1; i < rows.length; ++i) {
                            var row = rows[i];
                            var td = row.getElementsByTagName('td');
                            if (td.length >= 3) {
                                proxies.push({
                                    ip: td[1].innerHTML,
                                    port: +td[2].innerHTML
                                });
                            }
                        }
                        proxyPages.push(proxies);
                        var result = [];
                        if (proxyPages.length >= pagelength) {
                            for (i in proxyPages) {
                                var item = proxyPages[i];
                                result = result.concat(item);
                            }
                            callback(result);
                        }
                    }
                });
            }
        });
    }

};

var validProxy = function (proxies, callback) {
    var count = 0;
    var istime = function () {
        if (++count >= proxies.length) {
            var result = [];
            for(var i in proxies) {
                var item = proxies[i];
                if(item.valid)
                    result.push(item);
            }
            callback(result);
        }
    };
    for (var i in proxies) {
        var proxy = proxies[i];
        (function (proxy) {
            var req = http.request({
                host: proxy.ip,
                port: proxy.port,
                path: 'http://www.baidu.com',
                method: 'GET'
            }, function (res) {
                res.on('data', function () {
                });
                res.on('end', function () {
                    proxy.valid = true;
                    istime();
                });
            }).on('error', function () {
                proxy.valid = false;
                istime();
            }).on('socket', function(socket) {
                socket.setTimeout(15000);
                socket.on('timeout', function() {
                    proxy.valid = false;
                    req.abort();
                });
            });
            req.end();
        })(proxy);
    }
};

exports.test = function (callback) {
    domproxies(5, function (proxies) {
        validProxy(proxies, function (proxies) {
            console.log(proxies);
        });
    });
};