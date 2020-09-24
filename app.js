const redis = require("redis");
const client = redis.createClient();
const express = require('express')
const http = require('http');
const mustache = require('mustache')
const fs = require('fs')

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
var DutIncrementCounter = "DutAutoIncrement"

client.on("error", function(error) {
    console.error(error);
  });

var titlesCounter = 0;

function _deleteKey(startIndex, key)
{
    client.scan(startIndex, "match", key, function (err, replies)
    {
        if(err)
        {
            console.log(err)
            return
        }
        var keys = replies[1]
        keys.forEach(key => {
            client.del(key)
        })
        if(replies[0] != 0)
        {
            _deleteKey(replies[0], key)
        }
        return
    })
}

function Init()
{
    // New item returns 1
    // Existing item returns 0
    // Ignore duplicate Titles
    config.Columns.forEach(title => {
        client.sadd("TitlesSet", title, function(err, replies) {
            console.log(replies)
            if(replies === 1)
            {
                client.rpush("TitlesList", title)
            }
            titlesCounter++;
            if(titlesCounter === config.Columns.length)
            {
                // we need to wait til all the callbacks are done.
                // Otherwise TitlesList will be null because not everything has been pushed
                client.lrange("TitlesList","0","-1", function (err, replies) {
                    if(!err){
                        console.log(replies);
                        titles = replies;
                    }
                })
            }
        })
    });
    client.exists(DutIncrementCounter, function(err, replies)
    {
        if(!err)
        {
            if(replies == "0")
            {
                console.log("Adding counter")
                client.set(DutIncrementCounter,"0")
            }
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
    client.multi().incr(DutIncrementCounter).get(DutIncrementCounter).exec(function(err, replies)
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
    client.set(req.body.key, req.body.value, function(err, reply) {
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
    _deleteKey(0, req.body.key + "*")
    res.sendStatus(200)
})

app.get('/getTable/:scanId', (req, res) => {
    console.log("scan from " + req.params.scanId)
    
    client.scan(req.params.scanId, "match", "ROW*", function (err, replies) {
        if(!err){
            var result = [];
            var keyValue = {}
            console.log(replies)
            result.push(replies[0]) // scan index
            var queryTotal = 0
            var keys = replies[1]
            
            if(keys.length == 0)
            {
                result.push(keyValue)
                res.setHeader('Content-Type', 'text/json');
                res.send(result)
                return
            }
            keys.forEach(key => {
                client.get(key, function(err, reply) {
                    if(!err)
                    {
                        keyValue[key] = reply
                        queryTotal++
                        if(queryTotal == keys.length)
                        {
                            result.push(keyValue)
                            res.setHeader('Content-Type', 'text/json');
                            res.send(result)
                            return
                        }
                    }
                })
            })
        }
    })
})

app.get('/titles', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    res.send(titles)
})

Init()

app.listen(port,hostname)
