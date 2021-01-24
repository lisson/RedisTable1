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

    GetKeys(offset, pattern, callback)
    {
        var self = this
        self.client.scan(offset, "match", pattern, function (err, replies) {
            if(!err){
                logger.debug("RedisTableQuery::GetKeys " + replies)
                var nextOffset = replies[0]

                if(nextOffset == 0)
                { 
                    callback(replies[1])
                }
                else
                {
                    self.GetKeys(nextOffset, pattern, function (nextKeys)  {
                        callback(replies[1].concat(nextKeys))
                    })
                }
            }
            else
            {
                callback(null)
            }
        })
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
        this.GetKeys(0, pattern, function (reply) {
            (reply).forEach(element => {
                self.client.del(element)           
            });
        })
    }
    
    InsertKeyValue(key, value)
    {
        return new Promise((resolve, reject) => {
            this.client.set(key, value, function(err, result) {
                if (err) reject(err);
                else resolve(result);
            });
        });
    }

    KeyExists(key)
    {
        return new Promise((resolve, reject) => {
            this.client.exists(key, (err, result) => {
              if (err) reject(err);
              else resolve(result);
            });
        });
    }
}

module.exports = RedisTableQuery