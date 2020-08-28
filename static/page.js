var TitleToColumnMapping = [];

function UpdateTable()
{
    // Populate the table
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "getTable", false ); // false for synchronous request
    xmlHttp.send( null );
    let data = JSON.parse(xmlHttp.responseText)
    data[3].RowId = 10;
    console.log(data);
    var byRow = data.slice(0);
    byRow.sort(function(a,b) {
        return a.RowId - b.RowId;
    });

    var mainTable = document.getElementById("mainTable")
    var title = document.getElementById("title")

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
            currentRow.dataset.RowId = item.RowId;
            currentRow.id = "row" + item.RowId;
            mainTable.appendChild(currentRow);
            for(i=0;i<title.childElementCount;i++)
            {
                var databox = document.createElement("td")
                databox.dataset.titleid = title.children[i].dataset.titleid
                databox.className = "dataValue";
                databox.contentEditable = true;
                currentRow.appendChild(databox);
            }
        }
        var b = currentRow.children[TitleToColumnMapping[item.TitleId]]
        
        if(b === null)
        {
            return
        }
        b.textContent = item.value;
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
    });

    var mainTable = document.getElementById("mainTable");

    document.getElementById("addButton").addEventListener('click', function (event) {
        this.disabled=true;
        var row = document.createElement("tr");
        for(var i = 0; i < mainTable.dataset.columns; i++)
        {
            var d = document.createElement("td")
            d.contentEditable = "True"
            d.addEventListener("input", tableBoxDataHandler, false);
            d.addEventListener("focusout", focusOutHandler, false);
            d.className = "dataValue"
            row.appendChild(d)
        }
        mainTable.appendChild(row)
        this.disabled=false;
    });

    var title = document.getElementById("title")
    for(i=0;i<title.children.length;i++)
    {
        TitleToColumnMapping[title.children[i].dataset.titleid] = i;
    }
    //console.log(TitleToColumnMapping)

    UpdateTable()
}

function tableBoxDataHandler()
{
    console.log(this.textContent);
    console.log(this.parentNode)
}


function focusOutHandler()
{
    console.log("Focus out");
    console.log(this.parentNode)
}