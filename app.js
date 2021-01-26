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
            config.Columns.forEach(title => {
                var key = "Title:*:" + title
                redisClient.GetKeysPromise(0, key).then(k => {
                    return k.length == 0
                }).then(AddTitle => {
                    if(AddTitle)
                    {
                        return redisClient.IncrementPromise(TitleIncrementCounter)
                    }
                    else
                    {
                        return -1
                    }
                }).then(currentCounter => {
                    logger.info("Incremented Counter: " + currentCounter)
                    if(currentCounter == -1)
                    {
                        logger.info("Title: " + title + " already exists. Skipping" )
                        return false
                    }
                    var newKey = "Title:" + currentCounter + ":" + title
                    return redisClient.InsertKeyValuePromise(newKey, 0).then(x => { return x }).catch(err => {
                        logger.error("Insert Key error: " + err)
                    })
                }).then(result => {
                    logger.info("Insert title result: " + result)
                }).catch(err => {
                    logger.error(key + " error: " + err)
                })
            })
        }
    })
    
}

var DefaultTemplate = fs.readFileSync('./templates/DefaultTemplate.html', 'utf-8')

const hostname = '0.0.0.0';

const port = 3000;

app.get('/', (req, res) => {
    res.statusCode = 200;
    res.send(mustache.render(DefaultTemplate, {title: titles, columns: titles.length}));
});

app.post('/addRow', (req, res) => {
    client.multi().incr(RowIncrementCounter).get(RowIncrementCounter).exec(function(err, replies)
    {
        if(err)
        {
            res.status(400).send("Database error.")
            console.log(err)
        }
        res.setHeader('Content-Type', 'text/json');
        res.send({"lastID": replies[1]})
    })
});

app.post('/insertDataValue', (req, res) => {
    redisClient.InsertKeyValue(req.body.key, req.body.value, function(err, reply) {
        if(err)
        {
            res.status(400).send("Database error.")
            console.log(err)
        }
        res.setHeader('Content-Type', 'text/json');
        res.send(reply)
    });
})

app.post('/deleteRow', (req, res) => {
    console.log(req.body.key)
    redisClient.DeleteKey(0, req.body.key + "*")
    res.sendStatus(200)
})

app.get('/getKeyValues/:scanId', (req, res) => {
    console.log("scan from " + req.params.scanId)
    
    redisClient.GetKeyValues(req.params.scanId, "ROW*")
    .then((data) => {
        console.log(data)
        res.setHeader('Content-Type', 'text/json');
        res.send(data)
    }).catch(
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
