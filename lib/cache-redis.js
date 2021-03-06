var Promise = require("bluebird"),
    _ = require("lodash"),
    Redis = require("redis");

var _cacheClient;

var getCacheClient = function(ctx) {

    var needstoreload = false;

    if (!_cacheClient) {
        needstoreload = true;
    }

    if (needstoreload) {

        return ctx.getServers().then(function(servers) {

            if (_cacheClient) {
                _cacheClient.end();
            }
            _cacheClient = Redis.createClient(servers[0].port, servers[0].host);
            return _cacheClient;

        });
    }
    else {
        return new Promise(function(resolve) {
            resolve(_cacheClient);
            return;
        });
    }
};

function RedisCache() {

}

RedisCache.prototype.getServers = function getServers() {
    return new Promise(function(resolve) {
        return resolve([{
            server: "localhost",
            port: 6379
        }]);
    });
};

function setValue(cache_client, key, value, expiry_in_seconds, callback) {
    cache_client.set(key, value, function (err) {
        if (err) {
            callback(err);
            return;
        }
        if (expiry_in_seconds) {
            cache_client.expire(key, expiry_in_seconds);
        }
        callback(null);
    });
}

function getValue(cache_client, key, callback) {
    cache_client.get(key, function(err, val) {
        if (err) {
            callback(err, null);
            return;
        }
        callback(null, val);
        return;
    });
}

function getValues(cache_client, keys, callback) {
    cache_client.mget(keys, function(err, vals) {
        if (err) {
            callback(err, null);
            return;
        }
        var rtcObj = {};
        _.each(keys, function(key, index) {
            if(vals[index]) {
                rtcObj[key] = vals[index];
            }
        });
        callback(null, rtcObj);
        return;
    });
}

function removeValue(cache_client, key, callback) {
    cache_client.del(key, function(err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null);
        return;
    });
}

function removeAllValues(cache_client, callback) {
    cache_client.flushall(function(err) {
        if (err) {
            callback(err);
            return;
        }
        callback(null);
        return;
    });
}

RedisCache.prototype.set = function set(key, value, expiry_in_seconds) {
    var self = this;
    return getCacheClient(self).then(function(cache) {

        return Promise.promisify(setValue)(cache, key, value, expiry_in_seconds).then(function() {
            return;
        });

    }).then(function() {
        return;
    });
};

RedisCache.prototype.get = function get(key) {
    var self = this;
    return getCacheClient(self).then(function(cache) {

        return Promise.promisify(getValue)(cache, key).then(function(value) {
            if (value === false) {
                return null;
            }
            else {
                return value;
            }
        });

    }).then(function(val) {
        return val;
    });

};

RedisCache.prototype.getBatch = function getBatch(keys) {
    var self = this;
    return getCacheClient(self).then(function(cache) {

        return Promise.promisify(getValues)(cache, keys).then(function(values) {
            if (values === false) {
                return null;
            }
            else {
                return values;
            }
        });

    }).then(function(val) {
        return val;
    });

};

RedisCache.prototype.remove = function remove(key) {
    var self = this;
    return getCacheClient(self).then(function(cache) {
        return Promise.promisify(removeValue)(cache, key).then(function() {
            return;
        });

    }).then(function() {
        return;
    });

};

RedisCache.prototype.removeBatch = function removeBatch(keys) {
    var self = this;
    return getCacheClient(self).then(function(cache) {

        var promise_array = [];

        _.each(keys, function(key) {
            promise_array.push(Promise.promisify(removeValue)(cache, key));
        });

        return Promise.all(promise_array).spread(function() {
            return;
        }).then(function() {
            return;
        });
    }).then(function() {
        return;
    });

};

RedisCache.prototype.remove = function remove(key) {
    var self = this;
    return getCacheClient(self).then(function(cache) {
        return Promise.promisify(removeValue)(cache, key).then(function() {
            return;
        });

    }).then(function() {
        return;
    });

};

RedisCache.prototype.removeAll = function removeAll() {
    var self = this;
    return getCacheClient(self).then(function(cache) {
        return Promise.promisify(removeAllValues)(cache).then(function() {
            return;
        });

    }).then(function() {
        return;
    });

};

module.exports = RedisCache;
