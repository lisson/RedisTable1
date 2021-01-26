const { rejects } = require("assert");
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

    DeleteKey(pattern)
    {
        var self = this
        this.GetKeys(0, pattern, function (err, reply) {
            if(reply == null)
            {
                return
            }
            (reply).forEach(element => {
                self.client.del(element)           
            });
        })
    }
    
    GetKeys(offset, pattern, callback)
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
                    self.GetKeys(nextOffset, pattern, function (err, nextKeys)  {
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

    GetKeysPromise(offset, pattern)
    {
        return new Promise((resolve, reject) => {
            this.GetKeys(offset, pattern, function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    GetTitlesPromise()
    {
        return new Promise((resolve, reject) => {
            this.GetKeys(offset, "Title:*", function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
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