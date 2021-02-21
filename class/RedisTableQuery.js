const { rejects } = require("assert");
const { reject } = require("async");
const { resolve } = require("path");
const redis = require("redis");
const util = require('util')
const logger = require("../logger");

class RedisTableQuery {    
    constructor(redisHost, username, password) {
        this.redisHost = redisHost
        this.username = username
        this.password = password
    }

    Connect()
    {
        logger.info("RedisTableQuery::Connecting to redis.")
        this.client = redis.createClient();
        logger.info("RedisTableQuery::Connected")
    }

    DeleteKeysPromise(pattern)
    {
        return new Promise((resolve, reject) => {
            this.GetAllKeysPromise(pattern).then(keys => {
                (keys).forEach(key => {
                    this.client.del(key, function (err, result){
                        if(err)
                        {
                            reject(err)
                        }
                    })
                })
            })
            resolve("OK")
        })
    }

    GetAllKeys(offset, pattern, callback)
    {
        var self = this
        self.client.scan(offset, "match", pattern, function (err, replies) {
            if(!err){
                logger.debug("RedisTableQuery::GetKeys " + replies)
                var nextOffset = replies[0]

                if(nextOffset == 0)
                { 
                    callback(err, replies[1])
                }
                else
                {
                    self.GetAllKeys(nextOffset, pattern, function (err, nextKeys)  {
                        callback(err, replies[1].concat(nextKeys))
                    })
                }
            }
            else
            {
                callback(err, null)
            }
        })
    }

    GetAllKeysPromise(pattern)
    {
        return new Promise((resolve, reject) => {
            this.GetAllKeys(0, pattern, function (err, replies) {
                if(!err)
                    resolve(replies)
                else
                    reject(err)
            });
        });
    }

    GetKeysPromise(offset, pattern)
    {
        return new Promise((resolve, reject) => {
            this.client.scan(offset, "match", pattern, function (err, replies) {
                if(!err)
                    resolve(replies)
                else
                    reject(err)
            });
        });
    }

    GetKeyValuesPromise(keys)
    {
        return new Promise((resolve, reject) => {
            var result = {};
            var counter = 0;
            if(keys.length === 0)
            {
                resolve(result)
            }
            (keys).forEach(key => {
                this.GetValuePromise(key).then(value => {
                    result[key] = value;
                    counter++
                    if(keys.length === counter)
                    {
                        resolve(result)
                    }
                }).catch(err => {
                    reject(err)
                })
            })
        })
    }

    GetTitlesPromise()
    {
        return new Promise((resolve, reject) => {
            this.GetAllKeys(offset, "Title:*", function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    GetValuePromise(key)
    {
        return new Promise((resolve, reject) => {
            this.client.get(key, function(err, result) {
                if(!err)
                    resolve(result)
                else
                    reject(err)
            });
        })
    }

    InsertKeyValuePromise(key, value)
    {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    IncrementPromise(counterKey)
    {
        return new Promise((resolve, reject) => {
            this.client.multi().incr(counterKey).exec(function(err, replies) {
                if(err) reject(err);
                else resolve(replies)
            })
        })
    }

    KeyExistsPromise(key)
    {
        return new Promise((resolve, reject) => {
            this.client.exists(key, (err, result) => {
              if (err) reject(err);
              else resolve(result == 1);
            });
        });
    }
}

module.exports = RedisTableQuery