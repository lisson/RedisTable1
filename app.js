var RedisTableQuery = require("./class/RedisTableQuery.js")

const express = require('express')
const http = require('http');
const mustache = require('mustache')
const fs = require('fs')
const util = require('util')
const logger = require("./logger");

// Redis Schema
// ROW:<int>:TITLE = VALUE


var path = require('path');

var app = express();
app.use('/static', express.static(path.join(__dirname, 'static')))
app.use(express.urlencoded())
app.use(express.json());

var config = require('./config.json');
const { query } = require("express");

var titles = []
var RowIncrementCounter = "RowIncrementCounter"
var TitleIncrementCounter = "TitleIncrementCounter"
var redisClient

function Init()
{
    logger.info("Start.")
    redisClient = new RedisTableQuery("localhost", "","")
    redisClient.Connect()
    logger.info("Titles in config.json: " + config.Columns)
    SetupTitles()
    redisClient.KeyExistsPromise(RowIncrementCounter).then(exists => {
        if(!exists)
        {
            redisClient.InsertKeyValuePromise(RowIncrementCounter, "0").then(x => {
                return x
            }).catch(err => {
                logger.err("Unable to insert key " + RowIncrementCounter)
                logger.err(err)
                process.exit(1)
            })
        }
    }).catch(err => {
        logger.err("KeyExists check error:" + RowIncrementCounter)
        logger.err(err)
        process.exit(1)
    })
}

function SetupTitles()
{
    redisClient.KeyExistsPromise(TitleIncrementCounter).then(exists => {
        if(!exists)
        {
            redisClient.InsertKeyValuePromise(TitleIncrementCounter, "0").then(x => {
                return x
            }).catch(err => {
                logger.err("Unable to insert key " + TitleIncrementCounter)
                logger.err(err)
                process.exit(1)
            })
        }
        return true
    }).then(x => {
        if(x)
        {
            return new Promise((resolve, reject) => {
                var counter=0
                config.Columns.forEach(title => {
                    var key = "Title:*:" + title.Name
                    redisClient.GetAllKeysPromise(key).then(k => {
                        if( k.length === 0)
                        {
                            return redisClient.IncrementPromise(TitleIncrementCounter)
                        }
                        return k[0].split(":")[1]
                    }).then(currentCounter => {
                        if(currentCounter == -1)
                        {
                            logger.info("Title: " + title + " already exists. Skipping" )
                            return false
                        }
                        var newKey = "Title:" + currentCounter + ":" + title.Name
                        var titleType = title.Type
                        if(titleType == null)
                        {
                            titleType = "string"
                        }
                        return redisClient.InsertKeyValuePromise(newKey, titleType).then(x => { return x }).catch(err => {
                            logger.error("Insert Key error: " + err)
                        })
                    }).then(result => {
                        logger.info("Insert title result: " + result)
                        counter++
                        if(counter === config.Columns.length)
                        {
                            logger.info("Done inserting titles into database.")
                            resolve(true);
                        }
                    }).catch(err => {
                        logger.error(key + " error: " + err)
                        reject(false);
                    })
                })
            })
        }
    }).then(titleSetupOk => {
        if(titleSetupOk)
        {
            // Populate titles variable
            redisClient.GetAllKeysPromise("Title:*").then(results => {
                (results).forEach(t => {
                    var entry = {}
                    var p = t.split(":") // [0] is Title, [1] is index, [2] is title name Title:[index]:[name]
                    entry.TitleIndex = p[1]
                    entry.Value = p[2]
                    titles.push(entry)
                })
                titles.forEach(t => {
                    logger.info(t.TitleIndex + " " + t.Value)
                })
                
            }).catch(err => {
                logger.err(err)
            })
        }
    }).catch(err => {
        logger.err(err);
    })
    
}

var DefaultTemplate = fs.readFileSync('./templates/DefaultTemplate.html', 'utf-8')

const hostname = '0.0.0.0';

const port = 3000;

app.get('/', (req, res) => {
    res.statusCode = 200;
    res.send(mustache.render(DefaultTemplate, {title: titles, ColumnsCount: titles.length}));
});

app.post('/addRow', (req, res) => {
    redisClient.IncrementPromise(RowIncrementCounter).then(rowid => 
    {
        res.setHeader('Content-Type', 'text/json');
        res.send({"lastID": rowid})
        return redisClient.InsertKeyValuePromise("Row:" + rowid + ":" + titles[0].Value, "newvalue")
    }).then(x => {
        console.log(x);
    })
    .catch(err => {
        res.status(400).send("Database error.")
        console.log(err)
    })
});

app.post('/insertDataValue', (req, res) => {
    logger.info("Setting " + req.body.key + " to " + req.body.value);
    redisClient.InsertKeyValuePromise(req.body.key, req.body.value).then(x =>
    {
        res.setHeader('Content-Type', 'text/json')
        res.send(x)
    }).catch(err => {
        if(err)
        {
            res.status(400).send("Database error.")
            console.log(err)
        }
    });
})

app.post('/deleteRow', (req, res) => {
    console.log(req.body.key)
    redisClient.DeleteKeysPromise(req.body.key + "*").then(result => {
        res.sendStatus(200)
    }).catch(err => {
        console.log(err)
    })
    
})

app.get('/getKeyValues/:scanId', (req, res) => {
    logger.info("scan from " + req.params.scanId)
    result = {}
    redisClient.GetKeysPromise(req.params.scanId, "Row*").then(keys => {
        result["RedisIndex"] = keys[0]
        return redisClient.GetKeyValuesPromise(keys[1]);
    }).then((data) => {
        result["KeyValues"] = data
        res.set('Content-Type', 'application/json');
        res.send(JSON.stringify(result))
        logger.debug("Responded with : " + JSON.stringify(result))
    })
    .catch(
        err => {
            console.log(err)
    })
})

app.get('/titles', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    res.send(titles)
})

Init()

app.listen(port,hostname)
