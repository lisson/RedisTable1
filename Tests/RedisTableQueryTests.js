var RedisTableQuery = require("../class/RedisTableQuery.js")

var redisClient = new RedisTableQuery("localhost", "","")

redisClient.Connect()

redisClient.GetKeys(0,"KEY*", function (result)
{
    console.log("Got Keys: " + result)
})

redisClient.InsertKeyValue("TestKey1", "", function(err, reply){
    console.log(reply)
})

redisClient.KeyExists("TestKey1").then(result => {
    console.log(result)
}).catch(error => {console.log(error)});

redisClient.DeleteKey("TestKey1")

