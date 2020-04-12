const express = require('express')
const http = require('http');
const sqlite3 = require('sqlite3')
const mustache = require('mustache')
const fs = require('fs')
const DBPATH = "./default.db"
const TitleTable = "Column_Titles"
const DataTable = "Data_Table"

var app = express();

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

        let createData = "CREATE TABLE IF NOT EXISTS " + DataTable + " (id INTEGER PRIMARY KEY AUTOINCREMENT, TitleId INTEGER, value varchar(255), FOREIGN KEY(TitleId) REFERENCES " + TitleTable + "(title));";
        db.run(createData)

        let titleQuery = "SELECT Title FROM Column_Titles;"
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
                    titles.push(r.title)
                })
            })
        });
    });
}

var DefaultTemplate = fs.readFileSync('./templates/DefaultTemplate.html', 'utf-8')
//console.log(DefaultTemplate)

const hostname = '0.0.0.0';

const port = 3000;

app.get('/', (req, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html');
    var data = { title: titles,
    data: [
        {id: 1, dataArray: ["Item1","Item2"]},
        {id: 2, dataArray: ["Item2","Item2"]}]
    }
    res.send(mustache.render(DefaultTemplate, data));
});

app.post('/register', (reg, res) => {
    res.send("register");
});

app.get('/titles', (reg, res) => {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/json');
    res.send(titles)
})

Init()

app.listen(port,hostname)
