chrome.storage.local.get(["pg_data_store"], (item) => {
    var pg_data_store = item["pg_data_store"];
    if (pg_data_store != null && pg_data_store != undefined) {
        setProcessGroupResult(pg_data_store);
        document.getElementById("clearProcessGroupsResult").style.display = "block";
        document.getElementById("addAllItemsToQueue").style.display = "block";
    }
});

chrome.storage.local.get(["queue_data_store"], (item) => {
    var queue_data_store = item["queue_data_store"];
    if (queue_data_store != null && queue_data_store != undefined) {
        document.getElementById("clearQueue").style.display = "block";
        document.getElementById("copyQueue").style.display = "block";
        setQueueTable(queue_data_store);
    }
});

chrome.storage.local.get(["search_data_store"], (item) => {
    var search_data_store = item["search_data_store"];
    if (search_data_store != null && search_data_store != undefined) {
        document.getElementById("clearGlobalSearchResult").style.display = "block";
        document.getElementById("copySearchResults").style.display = "block";
        setSearchTable(search_data_store);
    }
});

document.addEventListener("DOMContentLoaded", (event) => {
    chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
        console.log(tabs[0].url);
        var instance = new URL(tabs[0].url).host.toString();
        console.log(instance);
        if (instance != null && tabs[0].url.toString().includes(`/nifi/`)) {
            document.getElementById("instance-name").innerHTML = `<span style="color:wheat;">${instance}</span>`;
            document.getElementById("getProcessGroups").style.display = "block";
            document.getElementById("getProcessGroups").style.display = "block";
            document.getElementById("getSearchResults").style.display = "block";
            document.getElementById("search_keyword").style.display = "block";
        }
    });
})


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
                                    var variables = pg_item["component"]["variables"];
                                    var queued_data = pg_item["status"]["aggregateSnapshot"]["queued"];

                                    pg_data_store["data"].push(
                                        {
                                            "pg_id": pg_id,
                                            "pg_name": pg_name,
                                            "running": running_components,
                                            "stopped": stopped_components,
                                            "invalid": invalid_components,
                                            "disabled": disabled_components,
                                            "variables": variables,
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

                                var temp_data_store = {};
                                temp_data_store[pg_data_store["parent_pg_id"] + "," + pg_data_store["instance_fetched_from"]] = pg_data_store["parent_pg_name"]
                                pg_data_store["data"].forEach((element) => {
                                    temp_data_store[element["pg_id"] + "," + pg_data_store["instance_fetched_from"]] = element["pg_name"]
                                });

                                chrome.storage.local.get(["omni_data_store"], (omni_store_item) => {
                                    var omni_data_store = omni_store_item["omni_data_store"];
                                    var final_omni_data_store = {};
                                    if (omni_data_store != null && omni_data_store != undefined) {
                                        final_omni_data_store = { ...temp_data_store, ...omni_data_store };
                                    }
                                    else {
                                        final_omni_data_store = temp_data_store;
                                    }
                                    chrome.storage.local.set({ "omni_data_store": final_omni_data_store }, () => {
                                        console.log("Saved!");
                                    });
                                });


                            }

                        }
                        document.getElementById("processGroupsResult").innerHTML = `<br><div class="spinner-border text-light" role="status">
                        <span class="visually-hidden">Loading...</span>
                        </div>`;
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
            var pg_data_store = item["pg_data_store"];
            if (pg_data_store != null && pg_data_store != undefined) {
                if (pg_data_store[event.target.id] == "default") {
                    pg_data_store["data"].sort((a, b) => (a[event.target.id.split("_")[0]] > b[event.target.id.split("_")[0]]) ? 1 : -1);
                    pg_data_store[event.target.id] = "ascending";
                    chrome.storage.local.set({ "pg_data_store": pg_data_store }, () => {
                        console.log("Saved!");
                    });
                }
                else if (pg_data_store[event.target.id] == "ascending") {
                    pg_data_store["data"].sort((a, b) => (a[event.target.id.split("_")[0]] < b[event.target.id.split("_")[0]]) ? 1 : -1);
                    pg_data_store[event.target.id] = "descending";
                    chrome.storage.local.set({ "pg_data_store": pg_data_store }, () => {
                        console.log("Saved!");
                    });
                }
                else {
                    pg_data_store["data"].sort((a, b) => (a[event.target.id.split("_")[0]] > b[event.target.id.split("_")[0]]) ? 1 : -1);
                    pg_data_store[event.target.id] = "ascending";
                    chrome.storage.local.set({ "pg_data_store": pg_data_store }, () => {
                        console.log("Saved!");
                    });
                }
                setProcessGroupResult(pg_data_store);
            }
        });

    }
});


function setProcessGroupResult(store_object) {
    var resultString = "";
    resultString += `<p style="color:#4CAAB8;"><b style="color:aqua;font-size:16px;">${store_object["instance_fetched_from"]}&nbsp;|&nbsp;<span><a style="text-decoration:none;color:tomato;" href="https://${store_object["instance_fetched_from"]}/nifi/?processGroupId=${store_object["parent_pg_id"]}" target="_blank">${store_object["parent_pg_name"]}</a></span></b><br>${store_object["fetched_time"]}</p>`;
    resultString += `<br><input class="form-control form-control-sm w-auto" type="text" id="processGroupsResultSearch" placeholder="Search process group name"><br><br>`;
    resultString += `<table class="table table-sm table-responsive table-bordered table-dark table-hover table-striped" id="processGroupsResultTable">`;
    resultString += `<tr class="table-info"><th>&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th>No</th>`;
    resultString += `<th>Process Group</th>`;
    resultString += `<th style="cursor: pointer;" id="running_head"><img src="../../assets/misc_icons/running.svg">Running</th>`;
    resultString += `<th style="cursor: pointer;" id="stopped_head"><img src="../../assets/misc_icons/stopped.svg">Stopped</th>`;
    resultString += `<th style="cursor: pointer;" id="invalid_head"><img src="../../assets/misc_icons/invalid.svg">Invalid</th>`;
    resultString += `<th style="cursor: pointer;" id="disabled_head"><img src="../../assets/misc_icons/disabled.svg">Disabled</th>`;
    resultString += `<th style="cursor: pointer;" id="queued_head">Queued<br>Count</th>`;
    resultString += `<th style="">Queued<br>Data</th></tr>`;

    let row_index = 1;
    resultString += `<tbody class="table-group-divider">`;
    store_object["data"].forEach((element) => {
        resultString += `<tr>`;
        resultString += `<td><button id="add-to-queue" class="btn btn-sm btn-primary" style="margin:10px;">+</button></td>`;
        resultString += `<td>${row_index}</td>`;
        resultString += `<td><div title="${element["pg_id"]}" id="process_group_name">
            ${element["pg_name"]}<br><br>
            <span>Link :</span>
            <a style="text-decoration:none; color:tomato;" title="${store_object["instance_fetched_from"]}" href="https://${store_object["instance_fetched_from"]}/nifi/?processGroupId=${element["pg_id"]}" target="_blank">Open</a><br><br>`;
        if (Object.keys(element["variables"]).length > 0) {
            resultString += `<a style="text-decoration:none; color:#189AB4;" data-bs-toggle="collapse" href="#var-${element["pg_id"]}" aria-expanded="false" aria-controls="var-${element["pg_id"]}">
            Variables ></a><br><br>`;
            resultString += `<div class="collapse" id="var-${element["pg_id"]}"><p>`;
            Object.keys(element["variables"]).forEach((variable) => {
                resultString += `<span style="color:wheat;">${variable}</span> : <pre>${element["variables"][variable].toString().replaceAll(`<`, `&lt;`).replaceAll(`>`, `&gt;`)}</pre><br>`;
            });
            resultString += `</div>`;
        }
        resultString += `</div></td>`;
        resultString += `<td>${element["running"]}</td>`;
        resultString += `<td>${element["stopped"]}</td>`;
        resultString += `<td>${element["invalid"]}</td>`;
        resultString += `<td>${element["disabled"]}</td>`;
        resultString += `<td>${element["queued"]}</td>`;
        resultString += `<td>${element["queued_data"]}</td></tr>`;
        row_index += 1;
    });
    resultString += `</tbody></table>`;

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
                pg_name_text = pg_name_text.toString().split(`Link :`)[0].toLowerCase();
                if (pg_name_text.indexOf(search_value) > -1) {
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
        var final_pg_data_store;
        chrome.storage.local.get(["pg_data_store"], (item) => {
            var pg_data_store = item["pg_data_store"];
            if (pg_data_store != null && pg_data_store != undefined) {
                final_pg_data_store = pg_data_store;
            }
        });
        var row = event.target.parentNode.parentNode.childNodes;
        var index = parseInt(row[1].textContent);
        event.target.parentNode.parentNode.className = "table-secondary";
        chrome.storage.local.get(["queue_data_store"], (item) => {
            var queue_data_store = item["queue_data_store"];
            if (queue_data_store != null && queue_data_store != undefined) {
                var key = final_pg_data_store["data"][index - 1]["pg_id"] + "," + final_pg_data_store["instance_fetched_from"];
                var value = final_pg_data_store["data"][index - 1]["pg_name"];
                if (key in queue_data_store) {
                    alert(`${key} Already exists in the queue!...`);
                }
                else {
                    queue_data_store[key] = value;
                    chrome.storage.local.set({ "queue_data_store": queue_data_store }, () => {
                        console.log("Saved!");
                    });
                    setQueueTable(queue_data_store);
                }
            }
            else {
                var temp_data = {};
                var key = final_pg_data_store["data"][index - 1]["pg_id"] + "," + final_pg_data_store["instance_fetched_from"];
                var value = final_pg_data_store["data"][index - 1]["pg_name"];
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
    resultString += `<table class="table table-sm table-responsive table-bordered table-dark table-hover table-striped" id="QueueTable">`;
    resultString += `<tr class="table-info"><th>&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th>&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th>PG Name</th>`;
    resultString += `<th>Id</th>`;
    resultString += `<th>Instance</th></tr>`;

    var row_index = 1;
    Object.keys(store_object).forEach((element) => {

        resultString += `<tr>`;
        resultString += `<td><br><br>&nbsp;&nbsp;<button id="remove-from-queue" class="btn btn-sm btn-primary" style="margin:10px;">-</button>&nbsp;&nbsp;<br></td>`;
        resultString += `<td>${row_index}</td>`;
        resultString += `<td>${store_object[element]}</td>`
        resultString += `<td>${element.split(",")[0]}<br><br><span style="color:wheat;">Link : </span><a style="text-decoration:none; color:tomato;" href="https://${element.split(",")[1]}/nifi/?processGroupId=${element.split(",")[0]}" target="_blank">Open</a></td>`;
        resultString += `<td>${element.split(",")[1]}</td></tr>`;

        row_index += 1;
    });
    resultString += `</table>`;
    resultString = `<p class="p">Queue size : ${row_index - 1}</p>` + resultString;

    document.getElementById("queueTableResult").innerHTML = resultString;
}

document.getElementById("goToQueue").addEventListener("click", (event) => {
    document.getElementById("queueTableResult").scrollIntoView();
});

document.body.addEventListener("click", (event) => {

    if (event.target.id == "remove-from-queue") {
        var row = event.target.parentNode.parentNode.childNodes;
        chrome.storage.local.get(["queue_data_store"], (item) => {
            var queue_data_store = item["queue_data_store"];
            if (queue_data_store != null && queue_data_store != undefined) {
                // console.log(itemValue);
                var key = row[3].textContent.split(":")[0].trim().replaceAll("Link", "") + "," + row[4].textContent;
                // console.log(key);
                delete queue_data_store[key];
                if (Object.keys(queue_data_store).length == 0) {
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
                    chrome.storage.local.set({ "queue_data_store": queue_data_store }, () => {
                        console.log("Saved!");
                    });
                    setQueueTable(queue_data_store);
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
        var queue_data_store = item["queue_data_store"];
        if (queue_data_store != null && queue_data_store != undefined) {
            var queue_data = `id,instance,pgName \n`;
            Object.keys(queue_data_store).forEach((element) => {
                queue_data += `${element.split(",")[0]}, ${element.split(",")[1]}, ${queue_data_store[element].toString().replaceAll(",", " ")} \n`;
            });
            navigator.clipboard.writeText(queue_data);
        }
    });

});

document.getElementById("addAllItemsToQueue").addEventListener("click", (event) => {
    chrome.storage.local.get(["pg_data_store"], (item) => {
        var pg_data_store = item["pg_data_store"];
        if (pg_data_store != null && pg_data_store != undefined) {
            chrome.storage.local.get(["queue_data_store"], (queue_item) => {
                var queue_data_store = queue_item["queue_data_store"];
                var temp_data = {};
                var final_data = {};
                pg_data_store["data"].forEach((element) => {

                    var key = element["pg_id"] + "," + pg_data_store["instance_fetched_from"];
                    var value = element["pg_name"];
                    temp_data[key] = value;
                });
                if (queue_data_store != null && queue_data_store != undefined) {
                    final_data = { ...queue_data_store, ...temp_data };
                }
                else {
                    final_data = temp_data;
                }
                chrome.storage.local.set({ "queue_data_store": final_data }, () => {
                    console.log("Saved!");
                });
                document.getElementById("clearQueue").style.display = "block";
                document.getElementById("copyQueue").style.display = "block";
                setQueueTable(final_data);
            });

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

                                var temp_data_store = {};
                                Object.keys(results).forEach((element) => {
                                    if (element != "hostname" && element != "search_keyword") {
                                        temp_data_store[element + "," + results["hostname"]] = results[element]["name"];
                                        results[element]["children"].forEach((record) => {
                                            temp_data_store[record[0] + "," + results["hostname"]] = record[1];
                                        });
                                    }
                                });

                                chrome.storage.local.get(["omni_data_store"], (omni_store_item) => {
                                    var omni_data_store = omni_store_item["omni_data_store"];
                                    var final_omni_data_store = {};
                                    if (omni_data_store != null && omni_data_store != undefined) {
                                        final_omni_data_store = { ...temp_data_store, ...omni_data_store };
                                    }
                                    else {
                                        final_omni_data_store = temp_data_store;
                                    }
                                    chrome.storage.local.set({ "omni_data_store": final_omni_data_store }, () => {
                                        console.log("Saved!");
                                    });
                                });
                            }
                        }
                        document.getElementById("globalSearchResult").innerHTML = `<br><div class="spinner-border text-light" role="status">
                        <span class="visually-hidden">Loading...</span>
                        </div>`;
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
    resultString += `<p class="p">Search results for <span style="color:#4CAAB8;"><b>${store_object["search_keyword"]}</b></span> in the instance <span style="color:#4CAAB8;"><b>${store_object["hostname"]}</b></span> :</p>`;
    resultString += `<table class="table table-sm table-responsive table-bordered table-dark table-hover table-striped" id="SearchTable">`;
    resultString += `<tr class="table-info"><th>No</th>`;
    resultString += `<th>Search Results</th></tr>`;

    var row_index = 1;
    Object.keys(store_object).forEach((element) => {
        if (element != "hostname" && element != "search_keyword") {
            resultString += `<tr>`;
            resultString += `<td>${row_index}</td>`;
            resultString += `<td>`;
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
        var search_data_store = item["search_data_store"];
        if (search_data_store != null && search_data_store != undefined) {
            var resultString = ``;
            resultString += `parent_pg_id, parent_pg_name, pg_id, pg_name\n`;
            Object.keys(search_data_store).forEach((element) => {
                if (element != "hostname" && element != "search_keyword") {
                    resultString += `${element},${search_data_store[element]["name"].toString().replaceAll(",", " ")},`;
                    search_data_store[element]["children"].forEach((flow, idx) => {
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
    chrome.storage.local.get(["omni_data_store"], (item) => {
        var omni_data_store = item["omni_data_store"];
        var text = document.getElementById("omni-store-size").innerText;
        if (omni_data_store != null && omni_data_store != undefined) {
            document.getElementById("omni-store-size").innerText = text + " " + Object.keys(omni_data_store).length.toString();
        }
        else {
            document.getElementById("omni-store-size").innerText = text + " 0";
        }
    });
});