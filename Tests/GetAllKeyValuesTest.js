var RedisTableQuery = require("../class/RedisTableQuery.js")

var redisClient = new RedisTableQuery("localhost", "","")

redisClient.Connect()

function GetAllKeyValues(index) {
    redisClient.GetKeysPromise(index, "Row*").then(result => 
        {
            redisClient.GetKeyValuesPromise(result[1]).then(x => {
            console.log("Key Value Pairs: ")
            console.log(x)
            return result[0]
        }).then(x => {
            if(x != 0)
            {
                GetAllKeyValues(x)
            }
        }).catch(err => {
                console.log(err)
        })   
    })
}

GetAllKeyValues(99)
