var RedisTableQuery = require("../class/RedisTableQuery.js")
var config = require('../config.json');

config.Columns.forEach(title => {
    if(title.Type != null)
    {
        console.log(title.Name + "," + title.Type)
    }
    else
    {
        console.log(title.Name)
    }
})