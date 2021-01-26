var RedisTableQuery = require("../class/RedisTableQuery.js")

var redisClient = new RedisTableQuery("localhost", "","")

redisClient.Connect()

redisClient.GetKeys(0,"KEY*", function (err, result)
{
    console.log("Got Keys: " + result)
})

redisClient.GetKeysPromise(0, "KEY*").then(result => {
    console.log("PROMISED KEYS: " + result)
})

redisClient.InsertKeyValuePromise("TestKey1", "0").then(reply => {
    console.log(reply)
})

redisClient.IncrementPromise("TestKey1").then(x => { return x }).then(reply => {
    console.log("IncrementedValue: " + reply)
})

redisClient.KeyExistsPromise("TestKey1").then(result => {
    console.log("Key exists: " + result)
}).catch(error => {console.log(error)});

redisClient.DeleteKey("Title:*")



