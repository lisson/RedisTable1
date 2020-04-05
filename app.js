const http = require('http');
const sqlite3 = require('sqlite3')
const mustache = require('mustache')
const fs = require('fs')
const DBPATH = "./default.db"
const TitleTable = "Column_Titles"


var config = require('./config.json')
var titles = []

function Init()
{
    let db = new sqlite3.Database(DBPATH, sqlite3.OPEN_READWRITE, (err) => {
        if(err) {
            console.error(err.message);
        }
        console.log("Connected to" + DBPATH)
    });


    db.serialize(function() {

        let createTitle = "CREATE TABLE IF NOT EXISTS " + TitleTable + " (id INTEGER PRIMARY KEY AUTOINCREMENT, title varchar(255));"
        db.run(createTitle)

        let titleQuery = "SELECT Title FROM Column_Titles;"
        db.all(titleQuery, [], (err, rows) => {
            if (err)
            {
                throw err;
            }

            rows.forEach((r) => {
                titles.push(r.title)
            })

            config.Columns.forEach((c) => {
                if(titles.includes(c) === false)
                {
                    console.log("Inserting "+ c)
                    let insertTitle = db.prepare("INSERT into " + TitleTable + " (title) VALUES (?);")
                    insertTitle.run(c)
                    insertTitle.finalize()
                }
            });
        });
    });
}

var DefaultTemplate = fs.readFileSync('./templates/DefaultTemplate.html', 'utf-8')
//console.log(DefaultTemplate)

const hostname = '0.0.0.0';

const port = 3000;

const server = http.createServer((req, res) => {
      res.statusCode = 200;
      res.setHeader('Content-Type', 'text/html');
    var data = { title: titles,
    data: [["Item1","Item2"], ["Item1","Item2"]]
    }
      res.end(mustache.render(DefaultTemplate, data));
});

Init()

server.listen(port, hostname, () => {
      console.log(`Server running at http://${hostname}:${port}/`);
});
