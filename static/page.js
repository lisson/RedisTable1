var TitleToColumnMapping = [];
var Titles;
const focusOutEvent = new Event('focusout');

function UpdateTable()
{
    // Populate the table
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "getTable", false ); // false for synchronous request
    xmlHttp.send( null );
    let data = JSON.parse(xmlHttp.responseText)
    console.log(data);
    var byRow = data.slice(0);
    byRow.sort(function(a,b) {
        return a.RowId - b.RowId;
    });

    var mainTable = document.getElementById("mainTable")

    while(mainTable.childElementCount > 1)
    {
        mainTable.deleteRow(1)
    }
    
    var currentRowIndex = -1;
    var currentRow = null;
    Array.prototype.forEach.call(byRow, function(item) {
        if(item.RowId != currentRowIndex)
        {
            currentRow = document.createElement("tr")
            currentRow.id = "row" + item.RowId;
            mainTable.appendChild(currentRow);
            for(i=0;i<Titles.childElementCount;i++)
            {
                var databox = document.createElement("td")
                databox.dataset.titleid = Titles.children[i].dataset.titleid
                databox.className = "dataValue";
                databox.contentEditable = true;
                databox.addEventListener("input", tableBoxDataHandler, false);
                databox.addEventListener("focusout", focusOutHandler, false);
                databox.addEventListener("keypress", databoxKeyPressHandler, false);
                currentRow.appendChild(databox);
            }
            databox = document.createElement("td")
            databox.textContent = "x"
            databox.className = "DeleteRowButtonClass"
            databox.addEventListener("click", deleteRowHandler, false);
            currentRow.appendChild(databox)
        }
        var b = currentRow.children[TitleToColumnMapping[item.TitleId]]
        
        if(b === null)
        {
            return
        }
        b.textContent = item.value;
        b.id = "box" +item.id
        currentRowIndex = item.RowId;
    });
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
                row.id = "row" + r.lastID;
                row.children[0].textContent = "Free"
                row.children[0].dispatchEvent(focusOutEvent)
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
            d.dataset.titleid = Titles.children[i].dataset.titleid
            row.appendChild(d)
        }
        mainTable.appendChild(row)

        xmlHttp.send();
        this.disabled=false;
    });

    for(i=0;i<title.children.length;i++)
    {
        TitleToColumnMapping[Titles.children[i].dataset.titleid] = i;
    }
    //console.log(TitleToColumnMapping)

    UpdateTable()
}

function tableBoxDataHandler()
{
    return
}

function focusOutHandler()
{
    if(this.id === "")
    {
        console.log("NEW BOX")
        var RowId = this.parentNode.id.substring(3,this.parentNode.id.length)
        console.log(this.textContent)
        var payload = JSON.stringify({"RowId": RowId, "TitleId": this.dataset.titleid, "value": this.textContent})
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("POST", "/insertDataValue");
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == XMLHttpRequest.DONE) {
                //console.log(xmlHttp.responseText);
                var r = JSON.parse(xmlHttp.responseText);
                console.log(r);
                this.id = "box" + r.lastID
            }
        }
        xmlHttp.send(payload);
        return
    }
    var dataId = this.id.substring(3,this.id.length)
    var payload = JSON.stringify({"DataId": dataId, "DataValue": this.textContent})
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "/updateDataValue");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(payload);
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
    var RowId = this.parentNode.id.substring(3,this.parentNode.id.length)
    var payload = JSON.stringify({"RowId": RowId})
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "/deleteRow");
    xmlHttp.setRequestHeader("Content-Type", "application/json");
    xmlHttp.send(payload);
    this.parentNode.remove()
}