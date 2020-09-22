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

client.on("error", function(error) {
    console.error(error);
  });

var titlesCounter = 0;
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
}

function _GetTable()
{

}

var DefaultTemplate = fs.readFileSync('./templates/DefaultTemplate.html', 'utf-8')

const hostname = '0.0.0.0';

const port = 3000;

app.get('/', (req, res) => {
    res.statusCode = 200;
    res.send(mustache.render(DefaultTemplate, {title: titles, columns: titles.length}));
});

app.post('/addRow', (req, res) => {
    let insertRow = db.prepare("INSERT into  " + RowTable + " VALUES (null);")
    insertRow.run(function(err) {
        if(err)
        {
            res.status(400).send("Database error.")
            console.log(err)
        }
        console.log(this.lastID)
        res.setHeader('Content-Type', 'text/json');
        res.send({"lastID": this.lastID})
    })
});

app.post('/updateDataValue', (req, res) => {
    db.run("UPDATE " + DataTable + " SET VALUE = ? WHERE id = ?;", [req.body.DataValue, req.body.DataId])
    res.sendStatus(200);
})

app.post('/insertDataValue', (req, res) => {
    let insertData = db.prepare("INSERT into  " + DataTable + "(RowId, TitleId, value) VALUES (?,?,?);", [req.body.RowId, req.body.TitleId, req.body.value])
    insertData.run(function(err) {
        if(err)
        {
            res.status(400).send("Database error.")
            console.log(err)
        }
        console.log(this.lastID)
        res.setHeader('Content-Type', 'text/json');
        res.send({"lastID": this.lastID})
    })
    insertData.finalize();
})

app.post('/deleteRow', (req, res) => {
    let deleteRow = db.prepare("DELETE FROM " + DataTable + " WHERE RowId = ?;", [req.body.RowId])
    deleteRow.run();
    deleteRow = db.prepare("DELETE FROM " + RowTable + " WHERE RowId = ?;", [req.body.RowId])
    deleteRow.run();
    res.sendStatus(200)
})

app.get('/getFreeRows', (req, res) => {
    let allFreeQuery = "SELECT A.* FROM " + DataTable + " A, " + DataTable + " B " +
    "WHERE A.TitleId = 1 AND (A.value = 'Free' OR A.value='free') \
    AND A.Id <> B.Id AND A.RowId = B.RowId;"
    db.all(allFreeQuery, [], (err, rows) => {
        res.setHeader('Content-Type', 'text/json');
        res.send(rows)
    })
})

app.get('/getTable/:scanId', (req, res) => {
    console.log("scan from " + req.params.scanId)
    client.scan(req.params.scanId, "match", "Row*", function (err, replies) {
        if(!err){
            var result = [];
            var keyValue = {}
            console.log(replies)
            result.push(replies[0]) // scan index
            var queryTotal = 0
            var keys = replies[1]
            keys.forEach(key => {
                client.get(key, function(err, reply) {
                    if(!err)
                    {
                        keyValue[key] = reply
                        queryTotal++
                        console.log(queryTotal + "/" + keys.length)
                        console.log(queryTotal == keys.length)
                        if(queryTotal == keys.length)
                        {
                            result.push(keyValue)
                            res.setHeader('Content-Type', 'text/json');
                            res.send(result)
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
