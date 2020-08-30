const express = require('express')
const http = require('http');
const sqlite3 = require('sqlite3')
const mustache = require('mustache')
const fs = require('fs')
const DBPATH = "./default.db"

const TitleTable = "Title_Table"
const DataTable = "Data_Table"
const RowTable = "Row_Table"

var path = require('path');

var app = express();
app.use('/static', express.static(path.join(__dirname, 'static')))
app.use(express.urlencoded())
app.use(express.json());


var config = require('./config.json')
var titles = []
var db;

function Init()
{
    db = new sqlite3.Database(DBPATH, sqlite3.OPEN_READWRITE, (err) => {
        if(err) {
            console.error(err.message);
        }
        console.log("Connected to" + DBPATH)
    });


    db.serialize(function() {

        let createTitle = "CREATE TABLE IF NOT EXISTS " + TitleTable + " (id INTEGER PRIMARY KEY AUTOINCREMENT, title varchar(255));"
        db.run(createTitle)

        let createRow = "CREATE TABLE IF NOT EXISTS " + RowTable + " (RowId INTEGER PRIMARY KEY AUTOINCREMENT);"
        db.run(createRow)

        let createData = "CREATE TABLE IF NOT EXISTS " + DataTable + " (dataId INTEGER PRIMARY KEY AUTOINCREMENT, RowId INTEGER, TitleId INTEGER, value varchar(255), FOREIGN KEY(TitleId) REFERENCES " + TitleTable + "(id), FOREIGN KEY(RowId) References " + RowTable + "(RowId));";
        db.run(createData)

        let titleQuery = "SELECT * FROM " + TitleTable + ";"
        db.all(titleQuery, [], (err, rows) => {
            if (err)
            {
                throw err;
            }

            rows.forEach((r) => {
                titles.push(r.title)
            })

            if(config.Columns.includes("State"))
            {
                throw "Illegal title 'State'"
            }

            if(titles.includes("State") === false)
            {
                let insertTitle = db.prepare("INSERT into " + TitleTable + " (title) VALUES (?);")
                insertTitle.run("State")
                insertTitle.finalize()
            }

            config.Columns.forEach((c)  => {
                if(titles.includes(c) === false)
                {
                    console.log("Inserting "+ c)
                    let insertTitle = db.prepare("INSERT into " + TitleTable + " (title) VALUES (?);")
                    insertTitle.run(c)
                    insertTitle.finalize()
                }
            });

            // Refresh the titles after populating it, otherwise first run would not show any titles
            db.all(titleQuery, [], (err, rows) => {
                if (err)
                {
                    throw err;
                }
                titles=[]
                rows.forEach((r) => {
                    titles.push({"titleId":r.id, "title": r.title})
                })
            })
        });
    });
}

function _GetTable()
{
    let allDataQuery = "SELECT * FROM " + DataTable + ";"
    db.all(allDataQuery, [], (err, rows) => {
        return rows
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

app.get('/getTable', (req, res) => { 
    let allDataQuery = "SELECT * FROM " + DataTable + ";"
    db.all(allDataQuery, [], (err, rows) => {
        res.setHeader('Content-Type', 'text/json');
        res.send(rows)
    })
})

app.get('/test', (req, res) => { 
    console.log(_GetTable())
    res.send("test")
})

app.get('/titles', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    res.send(titles)
})

Init()

app.listen(port,hostname)
