var TitleToColumnMapping = [];
var Titles;
const focusOutEvent = new Event('focusout');

function UpdateTable()
{
    _UpdateTable(0)
}

// Actual Redis keys are ROW:<int>
// But we're going to avoid using : in DOM id field so it'll be converted to ROW_<int>

function _UpdateTable(startingIndex)
{
    var mainTable = document.getElementById("mainTable")

    // Populate the table
    var currentIndex = startingIndex

    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "getKeyValues/" + currentIndex, false ); // false for synchronous request
    xmlHttp.send( null );

    let data = JSON.parse(xmlHttp.responseText)
    console.log(data);
    
    for (const [key, value] of Object.entries(data[1]))
    {
        rowid = key.split(":")[1]
        titleid = key.split(":")[2]
        console.log(rowid)
        var rowObject = mainTable.querySelector("#ROW_" + rowid);
        console.log(rowObject);
        if(rowObject == null)
        {
            console.log("Inserting new row");
            rowObject = document.createElement("tr")
            rowObject.id = "ROW_" + rowid;
            mainTable.appendChild(rowObject);
            for(i=0;i<Titles.childElementCount;i++)
            {
                var databox = document.createElement("td")
                databox.dataset.titleid = Titles.children[i].textContent.trim()
                databox.className = "dataValue";
                databox.contentEditable = true;
                databox.addEventListener("input", tableBoxDataHandler, false);
                databox.addEventListener("focusout", focusOutHandler, false);
                databox.addEventListener("keypress", databoxKeyPressHandler, false);
                rowObject.appendChild(databox);
            }
            databox = document.createElement("td")
            databox.textContent = "x"
            databox.className = "DeleteRowButtonClass"
            databox.addEventListener("click", deleteRowHandler, false);
            rowObject.appendChild(databox)
        }

        var b = rowObject.children[TitleToColumnMapping[titleid]]
        if(b === null)
        {
            continue
        }
        b.textContent = value;
    };
    if(data[0] != 0)
    {
        UpdateTable(data[0])
    }
}

window.addEventListener('DOMContentLoaded', (event) => {
    main()
});

function main()
{
    var dataItems = document.getElementsByClassName("dataValue");
    Array.prototype.forEach.call(dataItems, function(item) {
        item.addEventListener("input", tableDataHandler, false);
        item.addEventListener("focusout", focusOutHandler, false);
        item.addEventListener("keypress", databoxKeyPressHandler, false);
    });

    var mainTable = document.getElementById("mainTable");
    Titles = document.getElementById("title")

    document.getElementById("addButton").addEventListener('click', function (event) {
        this.disabled=true;

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("POST", "/addRow");
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == XMLHttpRequest.DONE) {
                var r = JSON.parse(xmlHttp.responseText);
                console.log(r);
                row.id = "ROW_" + r.lastID;
            }
        }

        var row = document.createElement("tr");
        for(var i = 0; i < mainTable.dataset.columns; i++)
        {
            var d = document.createElement("td")
            d.contentEditable = "True"
            d.addEventListener("input", tableBoxDataHandler, false);
            d.addEventListener("focusout", focusOutHandler, false);
            d.addEventListener("keypress", databoxKeyPressHandler, false);
            d.className = "dataValue"
            d.dataset.titleid = Titles.children[i].textContent
            row.appendChild(d)
        }
        mainTable.appendChild(row)

        xmlHttp.send();
        this.disabled=false;
    });

    for(i=0;i<title.children.length;i++)
    {
        TitleToColumnMapping[Titles.children[i].textContent.trim()] = i;
    }
    console.log(TitleToColumnMapping)

    UpdateTable()
}

function tableBoxDataHandler()
{
    return
}

function focusOutHandler()
{
    var RowId = this.parentNode.id.replace("_",":")
    var key = RowId+":"+this.dataset.titleid.trim()
    console.log(this.textContent)
    var payload = JSON.stringify({"key": key, "value": this.textContent.trim()})
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "/insertDataValue");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(payload);
    return
}

function databoxKeyPressHandler(e)
{    
    if(e.code === "Enter" || e.code == "NumpadEnter")
    {
        this.blur()
    }
}

function deleteRowHandler()
{
    console.log("Deleting " + this.parentNode.id);
    var RowId = this.parentNode.id.replace("_",":")
    var payload = JSON.stringify({"key": RowId})
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "/deleteRow");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(payload);
    this.parentNode.remove()
}