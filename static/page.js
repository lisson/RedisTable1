var TitleToColumnMapping = [];
var Titles;
const focusOutEvent = new Event('focusout');

$.tablesort.defaults = {
	compare: function(a, b) {		// Function used to compare values when sorting.
        if(isNumber(a) && isNumber(b))
        {
            a = parseInt(a)
            b = parseInt(b)
        }
		if (a > b) {
			return 1;
		} else if (a < b) {
			return -1;
		} else {
			return 0;
		}
	}
};

function isNumber(a)
{
    if(a.length === 0)
    {
        return false
    }
    return !isNaN(a)
}

async function UpdateTable()
{
    var result = await _UpdateTable(0)
    $("#mainTable").tablesort();
}

window.addEventListener('DOMContentLoaded', (event) => {
    main()
});

async function main()
{
    Titles = document.getElementById("title")

    document.getElementById("addButton").addEventListener('click', function (event) {
        this.disabled=true;

        var xmlHttp = new XMLHttpRequest();
        xmlHttp.open("POST", "/addRow");
        xmlHttp.setRequestHeader("Content-Type", "application/json");
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            {
                var r = JSON.parse(xmlHttp.responseText);
                var mainTable = document.getElementById("mainTableBody")
                var newRow = _createRow(r.lastID);
                if(newRow == null)
                {
                    return
                }
                mainTable.appendChild(newRow)
            }
        }
        xmlHttp.send();
        this.disabled=false;
    });

    for(i=0;i<title.children.length;i++)
    {
        TitleToColumnMapping[Titles.children[i].textContent.trim()] = i;
    }
    console.log(TitleToColumnMapping)

    await UpdateTable()
    $("#mainTable").data('tablesort').sort($("th.default-sort"), null);
}

function tableBoxDataHandler()
{
    return
}

function focusOutHandler()
{
    console.log("Updating " + this.parentNode.id);
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

// Actual Redis keys are ROW:<int>
// But we're going to avoid using : in DOM id field so it'll be converted to ROW_<int>

function _UpdateTable(startingIndex)
{
    return new Promise((resolve, reject) => {
        console.log("Updating table from index: " + startingIndex)
        var mainTable = document.getElementById("mainTableBody")

        // Populate the table
        var xmlHttp = new XMLHttpRequest();
        xmlHttp.onreadystatechange = function() {
            if (xmlHttp.readyState == 4 && xmlHttp.status == 200)
            {
                console.log("Response: " + xmlHttp.getResponseHeader('content-type'))
                console.log(xmlHttp.responseText)
                if(xmlHttp.responseText === "")
                {
                    reject(false)
                }
                let data = JSON.parse(xmlHttp.responseText.toString())

                for (const [key, value] of Object.entries(data.KeyValues))
                {
                    rowid = key.split(":")[1]
                    titleid = key.split(":")[2]
                    var rowObject = mainTable.querySelector("#ROW_" + rowid);
                    if(rowObject == null)
                    {
                        console.log("Inserting new row");
                        rowObject = _createRow(rowid)
                        if(rowObject == null)
                        {
                            continue
                        }
                        mainTable.appendChild(rowObject)
                    }

                    if(TitleToColumnMapping[titleid] == null)
                    {
                        // Title that doesn't exist
                        continue
                    }
                    var b = rowObject.children[TitleToColumnMapping[titleid]]
                    if(b === null)
                    {
                        continue
                    }
                    b.textContent = value;
                }
                if(data.RedisIndex > 0)
                {
                    resolve(_UpdateTable(data.RedisIndex));
                }
                else
                {
                    resolve(true);
                }
            }
        }
        xmlHttp.open("GET", "getKeyValues/" + startingIndex);
        xmlHttp.send();
    })
}

function _createDataValueBox(TitleId)
{
    var databox = document.createElement("td")
    databox.dataset.titleid = TitleId
    databox.className = "dataValue";
    databox.contentEditable = true;
    databox.addEventListener("input", tableBoxDataHandler, false);
    databox.addEventListener("focusout", focusOutHandler, false);
    databox.addEventListener("keypress", databoxKeyPressHandler, false);
    return databox
}

function _createDataValueBoxContent(TitleId, textContent)
{
    var databox = _createDataValueBox(TitleId)
    databox.textContent = textContent
    return databox
}

function _createDeleteBox()
{
    var deleteBox = document.createElement("td")
    deleteBox.textContent = "x"
    deleteBox.className = "DeleteRowButtonClass"
    deleteBox.addEventListener("click", deleteRowHandler, false);
    return deleteBox
}

function _createRow(RowId)
{
    if(RowId == null)
    {
        return null
    }
    console.log("Creating new Row " + RowId);
    rowObject = document.createElement("tr")
    rowObject.id = "Row_" + RowId;
    var rowNumberBox = document.createElement("td")
    rowNumberBox.textContent = RowId;
    rowObject.append(rowNumberBox)
    var mainTable = document.getElementById("mainTable")
    for(i=0;i<mainTable.dataset.columnscount;i++)
    {
        var databox = _createDataValueBox(Titles.children[i+1].textContent.trim())
        rowObject.appendChild(databox);
    }
    var deleteBox = _createDeleteBox()
    rowObject.appendChild(deleteBox)
    return rowObject
}
