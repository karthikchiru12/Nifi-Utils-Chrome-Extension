chrome.storage.local.get(["pg_data_store"], (item) => {
    var itemValue = item["pg_data_store"];
    if (itemValue != null && itemValue != undefined) {
        setProcessGroupResult(itemValue);
        document.getElementById("clearProcessGroupsResult").style.display = "block";
        document.getElementById("addAllItemsToQueue").style.display = "block";
    }
});

chrome.storage.local.get(["queue_data_store"], (item) => {
    var itemValue = item["queue_data_store"];
    if (itemValue != null && itemValue != undefined) {
        document.getElementById("clearQueue").style.display = "block";
        document.getElementById("copyQueue").style.display = "block";
        setQueueTable(itemValue);
    }
});

chrome.storage.local.get(["search_data_store"], (item) => {
    var itemValue = item["search_data_store"];
    if (itemValue != null && itemValue != undefined) {
        document.getElementById("clearGlobalSearchResult").style.display = "block";
        document.getElementById("copySearchResults").style.display = "block";
        setSearchTable(itemValue);
    }
});

document.getElementById("getInstanceName").addEventListener("click", (event) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        console.log(tabs[0].url);
        var instance = new URL(tabs[0].url).host.toString();
        console.log(instance);
        if (instance != null && tabs[0].url.toString().includes(`/nifi/`)) {
            document.getElementById("instance-name").innerHTML = `<span style="color:#4CAAB8; font-size:24px; width:100%;"><b>${instance}</b></span>`;
            document.getElementById("getProcessGroups").style.display = "block";
            document.getElementById("getProcessGroups").style.display = "block";
            document.getElementById("getSearchResults").style.display = "block";
            document.getElementById("search_keyword").style.display = "block";
        }
        else {
            alert("Please open this extension when a nifi instance is opened and is your current active tab!");
        }
    });
});


document.querySelector('#clearProcessGroupsResult').addEventListener("click", (event) => {
    document.getElementById('processGroupsResult').innerHTML = "";
    document.getElementById("clearProcessGroupsResult").style.display = "none";
    document.getElementById("addAllItemsToQueue").style.display = "none";
    chrome.storage.local.remove(["pg_data_store"], () => {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });
});


document.querySelector('#clearGlobalSearchResult').addEventListener("click", (event) => {
    document.getElementById('globalSearchResult').innerHTML = "";
    document.getElementById("clearGlobalSearchResult").style.display = "none";
    document.getElementById("copySearchResults").style.display = "none";
    chrome.storage.local.remove(["search_data_store"], () => {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });
});

document.querySelector('#clearQueue').addEventListener('click', (event) => {
    document.getElementById('queueTableResult').innerHTML = "";
    document.getElementById("clearQueue").style.display = "none";
    document.getElementById("copyQueue").style.display = "none";
    chrome.storage.local.remove(["queue_data_store"], () => {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });
});

document.getElementById("getProcessGroups").addEventListener("click", (event) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        try {
            chrome.tabs.sendMessage(tabs[0].id, { action_name: "getJwtToken" }, (response) => {
                try {
                    if (response.action_name == "getJwtToken") {
                        var token = JSON.parse(response.data)["item"];
                        var parent_pg = new URL(tabs[0].url).searchParams.get("processGroupId");
                        var instance_name = document.getElementById("instance-name").textContent;
                        if (parent_pg == null || parent_pg == undefined || parent_pg == "") {
                            parent_pg = "root";
                        }
                        async function getPgData() {
                            const url = `https://${instance_name}/nifi-api/flow/process-groups/${parent_pg}`;
                            const response = await fetch(url, {
                                "method": "GET",
                                "headers":
                                {
                                    "Authorization": `Bearer ${token}`
                                }
                            });
                            if (response.status == 200) {
                                var data = await response.json();
                                // console.log(data);
                                var pg_data_store = {};
                                var parent_pg_id = data["processGroupFlow"]["breadcrumb"]["breadcrumb"]["id"];
                                var parent_pg_name = data["processGroupFlow"]["breadcrumb"]["breadcrumb"]["name"];
                                var process_group_list = data["processGroupFlow"]["flow"]["processGroups"];

                                pg_data_store["parent_pg_id"] = parent_pg_id;
                                pg_data_store["parent_pg_name"] = parent_pg_name;
                                pg_data_store["instance_fetched_from"] = instance_name;
                                pg_data_store["fetched_time"] = new Date().toString();
                                pg_data_store["data"] = [];

                                for (var index = 0; index < process_group_list.length; index++) {
                                    var pg_item = process_group_list[index];
                                    var pg_id = pg_item["component"]["id"];
                                    var pg_name = pg_item["component"]["name"];
                                    var running_components = pg_item["component"]["runningCount"];
                                    var stopped_components = pg_item["component"]["stoppedCount"];
                                    var invalid_components = pg_item["component"]["invalidCount"];
                                    var disabled_components = pg_item["component"]["disabledCount"];
                                    var queued_data = pg_item["status"]["aggregateSnapshot"]["queued"];

                                    pg_data_store["data"].push(
                                        {
                                            "pg_id": pg_id,
                                            "pg_name": pg_name,
                                            "running": running_components,
                                            "stopped": stopped_components,
                                            "invalid": invalid_components,
                                            "disabled": disabled_components,
                                            "queued": parseInt(queued_data.split(" ")[0].replaceAll(",", "")),
                                            "queued_data": queued_data.split(" ")[1].replace("(", "") + " " + queued_data.split(" ")[2].replace(")", "")
                                        }
                                    );

                                }
                                pg_data_store["running_head"] = "default";
                                pg_data_store["stopped_head"] = "default";
                                pg_data_store["invalid_head"] = "default";
                                pg_data_store["disabled_head"] = "default";
                                pg_data_store["queued_head"] = "default";
                                // console.log(pg_data_store);
                                setProcessGroupResult(pg_data_store);
                                document.getElementById("clearProcessGroupsResult").style.display = "block";
                                document.getElementById("addAllItemsToQueue").style.display = "block";

                                chrome.storage.local.set({ "pg_data_store": pg_data_store }, () => {
                                    console.log("Saved!");
                                });
                            }

                        }
                        document.getElementById("processGroupsResult").innerHTML = "loading...";
                        getPgData();

                    }
                }
                catch (error) {
                    alert("Reload Nifi page and then try again!...");
                    console.log(error);
                }
            });
        }
        catch (error) {
            alert("Reload Nifi page and then try again!...");
            console.log(error);
        }
    });
});

document.body.addEventListener("click", (event) => {
    if (event.target.id.includes("_head")) {
        chrome.storage.local.get(["pg_data_store"], (item) => {
            var itemValue = item["pg_data_store"];
            if (itemValue != null && itemValue != undefined) {
                if (itemValue[event.target.id] == "default") {
                    itemValue["data"].sort((a, b) => (a[event.target.id.split("_")[0]] > b[event.target.id.split("_")[0]]) ? 1 : -1);
                    itemValue[event.target.id] = "ascending";
                    chrome.storage.local.set({ "pg_data_store": itemValue }, () => {
                        console.log("Saved!");
                    });
                }
                else if (itemValue[event.target.id] == "ascending") {
                    itemValue["data"].sort((a, b) => (a[event.target.id.split("_")[0]] < b[event.target.id.split("_")[0]]) ? 1 : -1);
                    itemValue[event.target.id] = "descending";
                    chrome.storage.local.set({ "pg_data_store": itemValue }, () => {
                        console.log("Saved!");
                    });
                }
                else {
                    itemValue["data"].sort((a, b) => (a[event.target.id.split("_")[0]] > b[event.target.id.split("_")[0]]) ? 1 : -1);
                    itemValue[event.target.id] = "ascending";
                    chrome.storage.local.set({ "pg_data_store": itemValue }, () => {
                        console.log("Saved!");
                    });
                }
                setProcessGroupResult(itemValue);
            }
        });

    }
});


function setProcessGroupResult(store_object) {
    var resultString = "";
    resultString += `<p style="color:#4CAAB8;"><b style="color:aqua;font-size:16px;">${store_object["instance_fetched_from"]}&nbsp;|&nbsp;<span><a style="text-decoration:none;color:tomato;" href="https://${store_object["instance_fetched_from"]}/nifi/?processGroupId=${store_object["parent_pg_id"]}" target="_blank">${store_object["parent_pg_name"]}</a></span></b><br>${store_object["fetched_time"]}</p>`;
    resultString += `<br><input type="text" id="processGroupsResultSearch" placeholder="Search process group name"><br><br>`;
    resultString += `<table style="border : 1px solid white; border-collapse: collapse;" id="processGroupsResultTable">`;
    resultString += `<tr><th style="border : 1px solid white; border-collapse: collapse;">&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse;"> </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;"> Process<br>Group </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;cursor: pointer;" id="running_head"><img src="../../assets/misc_icons/running.svg">&nbsp;Running </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;cursor: pointer;" id="stopped_head"><img src="../../assets/misc_icons/stopped.svg">&nbsp;Stopped </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;cursor: pointer;" id="invalid_head"><img src="../../assets/misc_icons/invalid.svg">&nbsp;Invalid </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;cursor: pointer;" id="disabled_head"><img src="../../assets/misc_icons/disabled.svg">&nbsp;Disabled </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;cursor: pointer;" id="queued_head"> Queued<br>Count </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse; text-align:center;"> Queued<br>Data </th></tr>`;

    let row_index = 1;
    store_object["data"].forEach((element) => {
        resultString += `<tr>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;"><br>&nbsp;&nbsp;<button id="add-to-queue" class="normal-button" style="margin:10px;">+</button>&nbsp;&nbsp;<br></td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${row_index}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse;" title="${element["pg_id"]}" id="process_group_name">
            ${element["pg_name"]}<br><br>
            <span style="color:wheat;">Link :</span>
            <a style="text-decoration:none; color:tomato;" title="${store_object["instance_fetched_from"]}" href="https://${store_object["instance_fetched_from"]}/nifi/?processGroupId=${element["pg_id"]}" target="_blank">Open</a><br><br>
            </td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${element["running"]}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${element["stopped"]}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${element["invalid"]}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${element["disabled"]}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse;white-space: nowrap; text-align:center;">${element["queued"]}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse;white-space: nowrap; text-align:center;">${element["queued_data"]}</td></tr>`;

        row_index += 1;
    });
    resultString += `</table>`;

    document.getElementById("processGroupsResult").innerHTML = resultString;
}

// https://www.w3schools.com/howto/howto_js_filter_table.asp
document.body.addEventListener("keyup", (event) => {
    if (event.target.id == "processGroupsResultSearch") {
        var search_value = document.getElementById("processGroupsResultSearch").value.toString().toLowerCase();
        var processGroupsResultTable = document.getElementById("processGroupsResultTable");
        var rows = processGroupsResultTable.getElementsByTagName("tr");
        for (var index = 0; index < rows.length; index++) {
            let pg_name = rows[index].getElementsByTagName("td")[2];
            if (pg_name) {
                let pg_name_text = pg_name.textContent || pg_name.innerText;
                if (pg_name_text.toString().toLowerCase().indexOf(search_value) > -1) {
                    rows[index].style.display = "";
                }
                else {
                    rows[index].style.display = "none";
                }
            }
        }

    }
});


document.body.addEventListener("click", (event) => {

    if (event.target.id == "add-to-queue") {
        var pg_data_store;
        chrome.storage.local.get(["pg_data_store"], (item) => {
            var itemValue = item["pg_data_store"];
            if (itemValue != null && itemValue != undefined) {
                pg_data_store = itemValue;
            }
        });
        var row = event.target.parentNode.parentNode.childNodes;
        var index = parseInt(row[1].textContent);
        event.target.parentNode.parentNode.style.backgroundColor = "#888";
        chrome.storage.local.get(["queue_data_store"], (item) => {
            var itemValue = item["queue_data_store"];
            if (itemValue != null && itemValue != undefined) {
                var key = pg_data_store["data"][index - 1]["pg_id"] + "," + pg_data_store["instance_fetched_from"];
                var value = pg_data_store["data"][index - 1]["pg_name"];
                if (key in itemValue) {
                    alert(`${key} Already exists in the queue!...`);
                }
                else {
                    itemValue[key] = value;
                    chrome.storage.local.set({ "queue_data_store": itemValue }, () => {
                        console.log("Saved!");
                    });
                    setQueueTable(itemValue);
                }
            }
            else {
                var temp_data = {};
                var key = pg_data_store["data"][index - 1]["pg_id"] + "," + pg_data_store["instance_fetched_from"];
                var value = pg_data_store["data"][index - 1]["pg_name"];
                temp_data[key] = value;
                chrome.storage.local.set({ "queue_data_store": temp_data }, () => {
                    console.log("Saved!");
                });
                document.getElementById("clearQueue").style.display = "block";
                document.getElementById("copyQueue").style.display = "block";
                document.getElementById("addAllItemsToQueue").style.display = "block";
                setQueueTable(temp_data);
            }
        });

    }
});

function setQueueTable(store_object) {

    var resultString = "";
    resultString += `<table style="border : 1px solid white; border-collapse: collapse;" id="QueueTable">`;
    resultString += `<tr><th style="border : 1px solid white; border-collapse: collapse;">&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse;">&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse;">PG Name</th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse;">Id</th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse;">Instance</th></tr>`;
    
    var row_index = 1;
    Object.keys(store_object).forEach((element) => {

        resultString += `<tr>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;"><br><br>&nbsp;&nbsp;<button id="remove-from-queue" class="normal-button" style="margin:10px;">-</button>&nbsp;&nbsp;<br></td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${row_index}</td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${store_object[element]}</td>`
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; white-space: nowrap;">${element.split(",")[0]}<br><br><span style="color:wheat;">Link : </span><a style="text-decoration:none; color:aqua;" href="https://${element.split(",")[1]}/nifi/?processGroupId=${element.split(",")[0]}" target="_blank">Open</a></td>`;
        resultString += `<td style="border : 1px solid white; border-collapse: collapse; white-space: nowrap; text-align:center;">${element.split(",")[1]}</td></tr>`;

        row_index += 1;
    });
    resultString += `</table>`;
    resultString = `<p>Queue size : ${row_index - 1}</p>` + resultString;

    document.getElementById("queueTableResult").innerHTML = resultString;
    // chrome.storage.local.set({ "queueTableResult": resultString }, () => {
    //     console.log("Saved!");
    // });
}

document.getElementById("goToQueue").addEventListener("click", (event) => {
    document.getElementById("queueTableResult").scrollIntoView();
});

document.body.addEventListener("click", (event) => {

    if (event.target.id == "remove-from-queue") {
        var row = event.target.parentNode.parentNode.childNodes;
        chrome.storage.local.get(["queue_data_store"], (item) => {
            var itemValue = item["queue_data_store"];
            if (itemValue != null && itemValue != undefined) {
                console.log(itemValue);//
                var key = row[3].textContent.split(":")[0].trim().replaceAll("Link", "") + "," + row[4].textContent;
                console.log(key);
                delete itemValue[key];
                if (Object.keys(itemValue) == 0) {
                    document.getElementById("clearQueue").style.display = "none";
                    document.getElementById("copyQueue").style.display = "none";
                    document.getElementById('queueTableResult').innerHTML = "";
                    chrome.storage.local.remove(["queue_data_store"], () => {
                        var error = chrome.runtime.lastError;
                        if (error) {
                            console.error(error);
                        }
                    });
                }
                else {
                    chrome.storage.local.set({ "queue_data_store": itemValue }, () => {
                        console.log("Saved!");
                    });
                    setQueueTable(itemValue);
                }
            }
        });
    }
});


document.body.addEventListener("click", (event) => {

    if (event.target.id == "process_group_name") {
        try {
            navigator.clipboard.writeText(event.target.title);
        }
        catch (error) {
            console.log(error);
        }
    }
});

document.getElementById("copyQueue").addEventListener("click", (event) => {

    var prod_items_present_in_queue = 0;
    chrome.storage.local.get(["queue_data_store"], (item) => {
        var itemValue = item["queue_data_store"];
        if (itemValue != null && itemValue != undefined) {
            var queue_data = `id,instance,pgName \n`;
            Object.keys(itemValue).forEach((element) => {
                queue_data += `${element.split(",")[0]}, ${element.split(",")[1]}, ${itemValue[element].toString().replaceAll(",", " ")} \n`;
            });
            navigator.clipboard.writeText(queue_data);
        }
    });

});

document.getElementById("addAllItemsToQueue").addEventListener("click", (event) => {
    chrome.storage.local.get(["pg_data_store"], (item) => {
        var itemValue = item["pg_data_store"];
        if (itemValue != null && itemValue != undefined) {
            var temp_data = {};
            itemValue["data"].forEach((element) => {

                var key = element["pg_id"] + "," + itemValue["instance_fetched_from"];
                var value = element["pg_name"];
                temp_data[key] = value;
            });
            chrome.storage.local.set({ "queue_data_store": temp_data }, () => {
                console.log("Saved!");
            });
            document.getElementById("clearQueue").style.display = "block";
            document.getElementById("copyQueue").style.display = "block";
            setQueueTable(temp_data);

        }
    });

});

document.getElementById("getSearchResults").addEventListener("click", (event) => {

    chrome.tabs.query({ currentWindow: true, active: true }, (tabs) => {
        try {
            chrome.tabs.sendMessage(tabs[0].id, { action_name: "getJwtToken" }, (response) => {
                try {
                    if (response.action_name == "getJwtToken") {
                        async function getSearchResults() {
                            var results = {};
                            var token = JSON.parse(response.data)["item"];
                            var instance = document.getElementById("instance-name").textContent;
                            var url = `https://${instance}/nifi-api/flow/search-results`;
                            var search_keyword = document.getElementById("search_keyword").value;
                            if (search_keyword != "" && search_keyword != undefined && search_keyword != undefined) {
                                url = url + `?q=${search_keyword}&a=root`;
                                // console.log(url);
                                const response = await fetch(url, {
                                    "method": "GET",
                                    "headers":
                                    {
                                        "Authorization": `Bearer ${token}`
                                    }
                                });
                                if (response.status == 200) {
                                    var data = await response.json();
                                    Object.keys(data["searchResultsDTO"]).forEach((element) => {
                                        if (element == "processGroupResults") {
                                            process_group_list = data["searchResultsDTO"]["processGroupResults"];
                                            process_group_list.forEach((process_group) => {
                                                if (!Object.keys(results).includes(process_group["id"])) {
                                                    results[process_group["id"]] = {};
                                                    results[process_group["id"]]["name"] = process_group["name"];
                                                    results[process_group["id"]]["children"] = [];
                                                }
                                                if (!Object.keys(results).includes(process_group["parentGroup"]["id"])) {
                                                    results[process_group["parentGroup"]["id"]] = {};
                                                    results[process_group["parentGroup"]["id"]]["name"] = process_group["parentGroup"]["name"];
                                                    results[process_group["parentGroup"]["id"]]["children"] = [];
                                                }
                                            });

                                            process_group_list.forEach((process_group) => {
                                                if (Object.keys(results).includes(process_group["parentGroup"]["id"])) {
                                                    var idx = process_group["id"];
                                                    var name = process_group["name"];
                                                    results[process_group["parentGroup"]["id"]]["children"].push([idx, name]);
                                                }
                                            });

                                            Object.keys(results).forEach((element) => {
                                                if (results[element]["children"] == 0) {
                                                    delete results[element];
                                                }
                                            });
                                        }
                                    });
                                }
                                results["search_keyword"] = search_keyword;
                                results["hostname"] = instance;
                                chrome.storage.local.set({ "search_data_store": results }, () => {
                                    console.log("Saved!");
                                });
                                setSearchTable(results);
                            }
                        }
                        document.getElementById("globalSearchResult").innerHTML = "loading...";
                        getSearchResults();
                    }
                }
                catch (error) {
                    alert("Reload Nifi page and then try again!...");
                    console.log(error);
                }
            });
        }
        catch (error) {
            alert("Reload Nifi page and then try again!...");
            console.log(error);
        }
    });

});

function setSearchTable(store_object) {

    var resultString = "";
    resultString += `<p>Search results for <span style="color:#4CAAB8;"><b>${store_object["search_keyword"]}</b></span> in the instance <span style="color:#4CAAB8;"><b>${store_object["hostname"]}</b></span> :</p>`;
    resultString += `<table style="border : 1px solid white; border-collapse: collapse; width:100%;" id="SearchTable">`;
    resultString += `<tr><th style="border : 1px solid white; border-collapse: collapse;"> </th>`;
    resultString += `<th style="border : 1px solid white; border-collapse: collapse;">Search Results</th></tr>`;

    var row_index = 1;
    Object.keys(store_object).forEach((element) => {
        if (element != "hostname" && element != "search_keyword") {
            resultString += `<tr>`;
            resultString += `<td style="border : 1px solid white; border-collapse: collapse; text-align:center;">${row_index}</td>`;
            resultString += `<td style="border : 1px solid white; border-collapse: collapse;">`;
            resultString += `&nbsp;<a style="text-decoration:none; color:wheat;" target="_blank" href="https://${store_object["hostname"]}/nifi/?processGroupId=${element}">${store_object[element]["name"]}</a><br><br>`;
            store_object[element]["children"].forEach((process_group) => {
                resultString += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`;
                resultString += `&bull;&nbsp;&nbsp;<a style="text-decoration:none; color:white; white-space: nowrap;" target="_blank" href="https://${store_object["hostname"]}/nifi/?processGroupId=${element}&componentIds=${process_group[0]}">${process_group[1]}</a><br><br>`;
            });
            resultString += `</td></tr>`;
            row_index = row_index + 1;
        }

    });
    resultString += `</table>`;
    document.getElementById("globalSearchResult").innerHTML = resultString;
    document.getElementById("clearGlobalSearchResult").style.display = "block";
    document.getElementById("copySearchResults").style.display = "block";
}

document.getElementById("goToGlobalSearch").addEventListener("click", (event) => {
    document.getElementById("globalSearchResult").scrollIntoView();
});


document.getElementById("copySearchResults").addEventListener("click", (event) => {

    chrome.storage.local.get(["search_data_store"], (item) => {
        var itemValue = item["search_data_store"];
        if (itemValue != null && itemValue != undefined) {
            var resultString = ``;
            resultString += `parent_pg_id, parent_pg_name, pg_id, pg_name\n`;
            Object.keys(itemValue).forEach((element) => {
                if (element != "hostname" && element != "search_keyword") {
                    resultString += `${element},${itemValue[element]["name"].toString().replaceAll(",", " ")},`;
                    itemValue[element]["children"].forEach((flow, idx) => {
                        if (idx == 0) {
                            resultString += `${flow[0]},${flow[1].toString().replaceAll(",", " ")}\n`;
                        }
                        else {
                            resultString += `,,${flow[0]},${flow[1].toString().replaceAll(",", " ")}\n`;
                        }
                    });
                }
            });
            navigator.clipboard.writeText(resultString);
        }
    });

});

window.addEventListener('DOMContentLoaded', (event) => {
    document.getElementById("utc-time").innerText = new Date().toUTCString();
    setInterval(() =>
        document.getElementById("utc-time").innerText = new Date().toUTCString()
        , 1000);
}); 