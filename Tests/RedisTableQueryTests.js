var RedisTableQuery = require("../class/RedisTableQuery.js")

var redisClient = new RedisTableQuery("localhost", "","")

redisClient.Connect()

redisClient.GetAllKeys(0,"KEY*", function (err, result)
{
    console.log("Got Keys: " + result)
})

redisClient.GetAllKeysPromise("KEY*").then(result => {
    console.log("PROMISED KEYS: " + result)
})

redisClient.GetKeysPromise(0, "Row*").then(result => {
        return redisClient.GetKeyValuesPromise(result[1]) 
}).then(x => {
    console.log("Key Value Pairs: ")
    console.log(x)
}).catch(err => {
        console.log(err)
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



