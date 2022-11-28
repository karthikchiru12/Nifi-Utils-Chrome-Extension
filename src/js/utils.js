/************************************************************************************************************/

async function getCachedItem(cacheIdentifier) {
    /*
       Fetches and returns a promise of cached item if it exists.

       parameters
       --------------------
       cacheIdentifier : String

       returns
       --------------------
       data : Promise
              
              Returns data when an item is present in the cache.
              Returns the value false when an item is not present in the cache.
    */
    try {
        var cacheItem = await chrome.storage.local.get([cacheIdentifier]);
        var data = cacheItem[cacheIdentifier];
        if (data != null && data != undefined) { // check if item is present in cache or not.
            return data;
        }
        else {
            console.log(`${cacheIdentifier} : Does not exist in the cache.`);
            return false;
        }
    }
    catch (error) {
        console.log(error);
        return false;
    }
}

function setCachedItem(cacheIdentifier, data) {
    /*
       Caches the given data.
      
       parameters
       --------------------
       cacheIdentifier : String
       data : Object

       returns
       --------------------
       undefined
    */
    chrome.storage.local.set({ [cacheIdentifier]: data }, () => {
        console.log(`Saved : ${cacheIdentifier}`);
    });
}

function clearCachedItem(cacheIdentifier) {
    /*
       Deletes the item in the cache.
      
       parameters
       --------------------
       cacheIdentifier : String

       returns
       --------------------
       undefined
    */
    chrome.storage.local.remove([cacheIdentifier], () => {
        var error = chrome.runtime.lastError;
        if (error) {
            console.error(error);
        }
    });
}

/************************************************************************************************************/

async function getActiveTab() {
    /*
       Fetches and returns the current active tab details.

       returns
       --------------------
       tabParams : Promise

                   Returns tab id, url, hostname if fetching active tab details is successful.
                   Returns the value false, if fetching active tab details fails.
    */
    try {
        var queryOptions = { currentWindow: true, active: true };
        var tabs = await chrome.tabs.query(queryOptions);
        if (tabs) {
            var tabId = tabs[0].id;
            var url = tabs[0][`url`];
            // if url is `https://company.domain.com/nifi/` then hostname is `company.domain.com`
            var hostname = new URL(url).hostname.toString();
            var tabParams = { "tabId": tabId, "url": url, "hostname": hostname };
            return tabParams;
        }
        else {
            console.log(error);
            return false;
        }
    }
    catch (error) {
        console.log(error);
        return false;
    }

}

async function sendMessage(tabId, message) {
    /*
       Sends a message to any content script functions.
       And then returns the response returned by the content script function.

       parameters
       --------------------
       tabId : String
       message : Object

       returns
       --------------------
       response : Promise

                   Returns tab id, url, hostname if fetching active tab details is successful.
                   Returns the value false, if fetching active tab details fails.
    */
    try {

        var response = await chrome.tabs.sendMessage(tabId, message);
        if (response) {
            return response;
        }
    }
    catch (error) {
        console.log(`There was an error in sending the message : ${error}`);
        alert(`Reload nifi page and then try again!...`);
        return false;
    }
}

/************************************************************************************************************/

async function fetchData(url, request, context) {
    /*
       Using fetch() sends the provided request and returns the corresponding response.

       parameters
       --------------------
       url : String
       request : Object
       context : String

       returns
       --------------------
       response : Promise

                   Returns data if fetch() call is successful.
                   Returns the value false, if it fails.
    */
    try {
        var response = await fetch(url, request);
        var data = await response.json();
        if (response.status == 200) {
            console.log(`Data fetched successfully : ${context}`);
            return data;
        }
        else {
            return false;
        }
    }
    catch (error) {
        console.log(`Data fetching failed : ${context}`);
        return false;
    }
}

/************************************************************************************************************/


window.addEventListener('DOMContentLoaded', (event) => {
    /*
       This event `DOMContentLoaded` triggers when the popup page of extension is completely loaded.
    */

    // Live UTC clock
    document.getElementById(`utcTime`).innerText = new Date().toUTCString();
    setInterval(() => document.getElementById(`utcTime`).innerText = new Date().toUTCString(), 1000);

    // Set Omni store size
    var omniStoreSize = document.getElementById(`omniStoreSize`);
    getCachedItem(`omniDataStore`).then((omniDataStore) => {
        if (omniDataStore) {
            omniStoreSize.innerText = omniStoreSize.innerText + ` ${Object.keys(omniDataStore).length}`;
        }
        else {
            omniStoreSize.innerText = omniStoreSize.innerText + ` 0`;
        }
    });



    getActiveTab().then((tabParams) => {
        if (tabParams) {
            var tabId = tabParams[`tabId`]
            var url = tabParams[`url`]
            var hostname = tabParams[`hostname`];
            if (tabId) {
                if (hostname != null && hostname != undefined && url.includes(`/nifi/`)) { // check if current active tab is a nifi instance
                    document.getElementById(`instanceName`).innerHTML = `<span style="color:wheat;">${hostname}</span>`;
                    document.getElementById(`getProcessGroups`).style.display = `block`;
                    document.getElementById(`getSearchResults`).style.display = `block`;
                    document.getElementById(`searchKeyword`).style.display = `block`;
                }
            }
        }
    });

    // Set cached process groups, if any
    getCachedItem(`pgDataStore`).then((pgDataStore) => {
        if (pgDataStore) {
            setProcessGroupTable(pgDataStore);
            document.getElementById(`clearProcessGroupsResult`).style.display = `block`;
            document.getElementById(`addAllItemsToQueue`).style.display = `block`;
        }
    });

    // Set cached queued items, if any
    getCachedItem(`queueDataStore`).then((queueDataStore) => {
        if (queueDataStore) {
            setQueueTable(queueDataStore);
            document.getElementById(`clearQueue`).style.display = `block`;
            document.getElementById(`copyQueue`).style.display = `block`;
        }
    });

    // Set cached search result items, if any
    getCachedItem(`searchDataStore`).then((searchDataStore) => {
        if (searchDataStore) {
            setSearchTable(searchDataStore);
            document.getElementById(`clearSearchResult`).style.display = `block`;
            document.getElementById(`copySearchResults`).style.display = `block`;
        }
    });
});

/************************************************************************************************************/

// Clears the cached process groups result and resets the popup UI
document.querySelector(`#clearProcessGroupsResult`).addEventListener(`click`, () => {
    document.getElementById(`processGroupsResult`).innerHTML = ``;
    document.getElementById(`clearProcessGroupsResult`).style.display = `none`;
    document.getElementById(`addAllItemsToQueue`).style.display = `none`;
    clearCachedItem(`pgDataStore`);
});

// Clears the cached queued items and resets the popup UI
document.querySelector(`#clearQueue`).addEventListener(`click`, () => {
    document.getElementById(`queueResult`).innerHTML = ``;
    document.getElementById(`clearQueue`).style.display = `none`;
    document.getElementById(`copyQueue`).style.display = `none`;
    clearCachedItem(`queueDataStore`);
});

// Clears the cached search results and resets the popup UI
document.querySelector(`#clearSearchResult`).addEventListener(`click`, () => {
    document.getElementById(`searchResult`).innerHTML = ``;
    document.getElementById(`clearSearchResult`).style.display = `none`;
    document.getElementById(`copySearchResults`).style.display = `none`;
    clearCachedItem(`searchDataStore`);
});

/************************************************************************************************************/

// Copies the process group id to clipboard, when clicked anywhere on the process group name
document.body.addEventListener(`click`, (event) => {
    if (event.target.id == `process_group_name`) {
        try {
            navigator.clipboard.writeText(event.target.title);
        }
        catch (error) {
            console.log(error);
        }
    }
});

// Scrolls to the queue section of popup
document.getElementById("goToQueue").addEventListener("click", (event) => {
    document.getElementById("queueResult").scrollIntoView();
});

// Scrolls to the search section of popup
document.getElementById(`goToGlobalSearch`).addEventListener(`click`, () => {
    document.getElementById(`searchResult`).scrollIntoView();
});

/************************************************************************************************************/


document.getElementById(`getProcessGroups`).addEventListener(`click`, () => {
    /*
       Fetch process groups
    */

    getActiveTab().then((tabParams) => {
        var tabId = tabParams[`tabId`]
        var url = tabParams[`url`]
        var hostname = tabParams[`hostname`];
        console.log(tabId, url, hostname);
        if (tabId) { // When active tab properties are successfully fetched
            var messageRequest = { actionName: `getJwtToken` };
            sendMessage(tabId, messageRequest).then((messageResponse) => { // Send a message to content script to fetch jwt token.
                if (messageResponse) {
                    if (messageResponse.actionName == `jwtToken`) {
                        // Set the loading spinner while the below statements are executed.
                        document.getElementById(`processGroupsResult`).innerHTML = `<br><div class="spinner-border text-light" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                    </div>`;
                        var token = JSON.parse(messageResponse.data)[`item`]; // jwt token
                        var parentPgId = new URL(url).searchParams.get(`processGroupId`);
                        if (parentPgId == null || parentPgId == undefined || parentPgId == ``) { // if process group id is not present in url
                            parentPgId = `root`; // Assume process group id as `root`
                        }
                        var request = {
                            "method": "GET",
                            "headers":
                                { "Authorization": `Bearer ${token}` }
                        };
                        fetchData(url = `https://${hostname}/nifi-api/flow/process-groups/${parentPgId}`,
                            request, `processGroups`).then((data) => {
                                if (data) { // When data is successfully fetched
                                    var pgDataStore = {};
                                    var parentPgId = data[`processGroupFlow`][`breadcrumb`][`breadcrumb`][`id`];
                                    var parentPgName = data[`processGroupFlow`][`breadcrumb`][`breadcrumb`][`name`];
                                    var processGroupsList = data[`processGroupFlow`][`flow`][`processGroups`];

                                    pgDataStore[`parentPgId`] = parentPgId;
                                    pgDataStore[`parentPgName`] = parentPgName;
                                    pgDataStore[`instanceFetchedFrom`] = hostname;
                                    pgDataStore[`fetchedTime`] = new Date().toString();
                                    pgDataStore[`data`] = [];

                                    for (var index = 0; index < processGroupsList.length; index++) {
                                        var pgItem = processGroupsList[index];
                                        var pgId = pgItem[`component`][`id`];
                                        var pgName = pgItem[`component`][`name`];
                                        var runningComponents = pgItem[`component`][`runningCount`];
                                        var stoppedComponents = pgItem[`component`][`stoppedCount`];
                                        var invalidComponents = pgItem[`component`][`invalidCount`];
                                        var disabledComponents = pgItem[`component`][`disabledCount`];
                                        var variables = pgItem[`component`][`variables`];
                                        var queuedData = pgItem[`status`][`aggregateSnapshot`][`queued`];

                                        pgDataStore[`data`].push(
                                            {
                                                "pgId": pgId,
                                                "pgName": pgName,
                                                "running": runningComponents,
                                                "stopped": stoppedComponents,
                                                "invalid": invalidComponents,
                                                "disabled": disabledComponents,
                                                "variables": variables,
                                                "queued": parseInt(queuedData.split(" ")[0].replaceAll(",", "")),
                                                "queuedData": queuedData.split(" ")[1].replace("(", "") + " " + queuedData.split(" ")[2].replace(")", "")
                                            }
                                        );

                                    }
                                    pgDataStore[`running_head`] = `default`;
                                    pgDataStore[`stopped_head`] = `default`;
                                    pgDataStore[`invalid_head`] = `default`;
                                    pgDataStore[`disabled_head`] = `default`;
                                    pgDataStore[`queued_head`] = `default`;

                                    console.log(pgDataStore);

                                    setProcessGroupTable(pgDataStore);
                                    document.getElementById(`clearProcessGroupsResult`).style.display = `block`;
                                    document.getElementById(`addAllItemsToQueue`).style.display = `block`;

                                    setCachedItem(`pgDataStore`, pgDataStore);

                                    var tempDataStore = {};
                                    tempDataStore[pgDataStore[`parentPgId`] + "," + pgDataStore[`instanceFetchedFrom`]] = pgDataStore[`parentPgName`];
                                    pgDataStore[`data`].forEach((element) => {
                                        tempDataStore[element[`pgId`] + `,` + pgDataStore[`instanceFetchedFrom`]] = element[`pgName`]
                                    });

                                    // Updating the omniDataStore with new process groups
                                    getCachedItem(`omniDataStore`).then((omniDataStore) => {
                                        var finalOmniDataStore = {};
                                        if (omniDataStore) {
                                            finalOmniDataStore = { ...tempDataStore, ...omniDataStore };
                                        }
                                        else {
                                            finalOmniDataStore = tempDataStore;
                                        }
                                        setCachedItem(`omniDataStore`, finalOmniDataStore);
                                    });

                                }
                            }).catch((error) => {
                                console.log(error);
                            });

                    }
                }
            }).catch((error) => {
                console.log(error);
                alert(`Reload nifi page and then try again!...`);
            });

        }
    }).catch((error) => {
        console.log(error);
        alert(`Reload nifi page and then try again!...`);
    });
});


document.body.addEventListener(`click`, (event) => {
    /*
       Sorting data by columns in process groups table
    */

    if (event.target.id.includes(`_head`)) {
        getCachedItem(`pgDataStore`).then((pgDataStore) => {
            if (pgDataStore) {
                if (pgDataStore[event.target.id] == `default`) {
                    pgDataStore[`data`].sort((a, b) => (a[event.target.id.split(`_`)[0]] > b[event.target.id.split(`_`)[0]]) ? 1 : -1);
                    pgDataStore[event.target.id] = `ascending`;
                    setCachedItem(`pgDataStore`, pgDataStore);
                }
                else if (pgDataStore[event.target.id] == `ascending`) {
                    pgDataStore[`data`].sort((a, b) => (a[event.target.id.split(`_`)[0]] < b[event.target.id.split(`_`)[0]]) ? 1 : -1);
                    pgDataStore[event.target.id] = `descending`;
                    setCachedItem(`pgDataStore`, pgDataStore);
                }
                else {
                    pgDataStore[`data`].sort((a, b) => (a[event.target.id.split(`_`)[0]] > b[event.target.id.split(`_`)[0]]) ? 1 : -1);
                    pgDataStore[event.target.id] = `ascending`;
                    setCachedItem(`pgDataStore`, pgDataStore);
                }
                setProcessGroupTable(pgDataStore);
            }
        });
    }
});

function setProcessGroupTable(storeObject) {
    /*
       Updating process groups table
    */
    var resultString = "";
    resultString += `<p style="color:#4CAAB8;"><b style="color:aqua;font-size:16px;">${storeObject["instanceFetchedFrom"]}&nbsp;|&nbsp;<span><a style="text-decoration:none;color:tomato;" href="https://${storeObject["instanceFetchedFrom"]}/nifi/?processGroupId=${storeObject["parentPgId"]}" target="_blank">${storeObject["parentPgName"]}</a></span></b><br>${storeObject["fetchedTime"]}</p>`;
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

    let rowIndex = 1;
    resultString += `<tbody class="table-group-divider">`;
    storeObject[`data`].forEach((element) => {
        resultString += `<tr>`;
        resultString += `<td><button id="add-to-queue" class="btn btn-sm btn-primary" style="margin:10px;">+</button></td>`;
        resultString += `<td>${rowIndex}</td>`;
        resultString += `<td><div title="${element["pgId"]}" id="process_group_name">
            ${element["pgName"]}<br><br>
            <span>Link :</span>
            <a style="text-decoration:none; color:tomato;" title="${storeObject["instanceFetchedFrom"]}" href="https://${storeObject["instanceFetchedFrom"]}/nifi/?processGroupId=${element["pgId"]}" target="_blank">Open</a><br><br>`;
        if (Object.keys(element["variables"]).length > 0) {
            resultString += `<a style="text-decoration:none; color:#189AB4;" data-bs-toggle="collapse" href="#var-${element["pgId"]}" aria-expanded="false" aria-controls="var-${element["pgId"]}">
            Variables ></a><br><br>`;
            resultString += `<div class="collapse" id="var-${element["pgId"]}"><p>`;
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
        resultString += `<td>${element["queuedData"]}</td></tr>`;
        rowIndex += 1;
    });
    resultString += `</tbody></table>`;

    document.getElementById("processGroupsResult").innerHTML = resultString;
}

// Code taken from here : https://www.w3schools.com/howto/howto_js_filter_table.asp
document.body.addEventListener(`keyup`, (event) => {
    /*
       Filtering process group name in process group table
    */
    if (event.target.id == `processGroupsResultSearch`) {
        var searchValue = document.getElementById(`processGroupsResultSearch`).value.toString().toLowerCase();
        var processGroupsResultTable = document.getElementById(`processGroupsResultTable`);
        var rows = processGroupsResultTable.getElementsByTagName(`tr`);
        for (var index = 0; index < rows.length; index++) {
            let pgName = rows[index].getElementsByTagName(`td`)[2];
            if (pgName) {
                let pgNameText = pgName.textContent || pgName.innerText;
                pgNameText = pgNameText.toString().split(`Link :`)[0].toLowerCase();
                if (pgNameText.indexOf(searchValue) > -1) {
                    rows[index].style.display = ``;
                }
                else {
                    rows[index].style.display = `none`;
                }
            }
        }

    }
});

/************************************************************************************************************/

document.body.addEventListener(`click`, (event) => {
    /*
       Adding a process group to queue
    */
    if (event.target.id == `add-to-queue`) {
        var finalPgDataStore;
        getCachedItem(`pgDataStore`).then((pgDataStore) => {
            if (pgDataStore) {
                finalPgDataStore = pgDataStore;
                var row = event.target.parentNode.parentNode.childNodes;
                var index = parseInt(row[1].textContent);
                event.target.parentNode.parentNode.className = `table-secondary`;

                getCachedItem(`queueDataStore`).then((queueDataStore) => {
                    if (queueDataStore) { // if there are elements in the queue
                        var key = finalPgDataStore[`data`][index - 1][`pgId`] + `,` + finalPgDataStore[`instanceFetchedFrom`];
                        var value = finalPgDataStore[`data`][index - 1][`pgName`];
                        if (key in queueDataStore) {
                            alert(`${key} Already exists in the queue!...`);
                        }
                        else {
                            queueDataStore[key] = value;
                            setCachedItem(`queueDataStore`, queueDataStore);
                            setQueueTable(queueDataStore);
                        }
                    }
                    else { // if queue is empty
                        var tempDataStore = {};
                        var key = finalPgDataStore[`data`][index - 1][`pgId`] + `,` + finalPgDataStore[`instanceFetchedFrom`];
                        var value = finalPgDataStore[`data`][index - 1][`pgName`];
                        tempDataStore[key] = value;

                        setCachedItem(`queueDataStore`, tempDataStore);

                        document.getElementById(`clearQueue`).style.display = `block`;
                        document.getElementById(`copyQueue`).style.display = `block`;
                        document.getElementById(`addAllItemsToQueue`).style.display = `block`;

                        setQueueTable(tempDataStore);
                    }
                });

            }
        });

    }
});


document.body.addEventListener(`click`, (event) => {
    /*
       Removing a process group from the queue
    */
    if (event.target.id == `remove-from-queue`) {
        var row = event.target.parentNode.parentNode.childNodes;
        getCachedItem(`queueDataStore`).then((queueDataStore) => {
            if (queueDataStore) {
                var key = row[3].textContent.split(":")[0].trim().replaceAll(`Link`, ``) + `,` + row[4].textContent;
                delete queueDataStore[key];

                if (Object.keys(queueDataStore).length == 0) { // If queue items are emptied
                    document.getElementById(`clearQueue`).style.display = `none`;
                    document.getElementById(`copyQueue`).style.display = `none`;
                    document.getElementById(`queueResult`).innerHTML = ``;
                    clearCachedItem(`queueDataStore`);
                }
                else {
                    setCachedItem(`queueDataStore`, queueDataStore);
                    setQueueTable(queueDataStore);
                }
            }
        });

    }
});


function setQueueTable(storeObject) {
    /*
       Updating the queue table
    */

    var resultString = ``;
    resultString += `<table class="table table-sm table-responsive table-bordered table-dark table-hover table-striped" id="QueueTable">`;
    resultString += `<tr class="table-info"><th>&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th>&nbsp;&nbsp;&nbsp;</th>`;
    resultString += `<th>PG Name</th>`;
    resultString += `<th>Id</th>`;
    resultString += `<th>Instance</th></tr>`;

    var rowIndex = 1;
    Object.keys(storeObject).forEach((element) => {

        resultString += `<tr>`;
        resultString += `<td><br><br>&nbsp;&nbsp;<button id="remove-from-queue" class="btn btn-sm btn-primary" style="margin:10px;">-</button>&nbsp;&nbsp;<br></td>`;
        resultString += `<td>${rowIndex}</td>`;
        resultString += `<td>${storeObject[element]}</td>`
        resultString += `<td>${element.split(",")[0]}<br><br><span style="color:wheat;">Link : </span><a style="text-decoration:none; color:tomato;" href="https://${element.split(",")[1]}/nifi/?processGroupId=${element.split(",")[0]}" target="_blank">Open</a></td>`;
        resultString += `<td>${element.split(",")[1]}</td></tr>`;

        rowIndex += 1;
    });
    resultString += `</table>`;
    resultString = `<p class="p">Queue size : ${rowIndex - 1}</p>` + resultString;

    document.getElementById("queueResult").innerHTML = resultString;
}


document.getElementById(`copyQueue`).addEventListener(`click`, () => {
    /*
       Copying the queued items to clipboard in csv format
    */
    getCachedItem(`queueDataStore`).then((queueDataStore) => {
        if (queueDataStore) {
            var queueData = `id,instance,pgName \n`;
            Object.keys(queueDataStore).forEach((element) => {
                queueData += `${element.split(`,`)[0]}, ${element.split(`,`)[1]}, ${queueDataStore[element].toString().replaceAll(`,`, ` `)} \n`;
            });
            navigator.clipboard.writeText(queueData);
        }
    });

});


document.getElementById(`addAllItemsToQueue`).addEventListener(`click`, () => {
    /*
       Adding all items to the queue
    */
    getCachedItem(`pgDataStore`).then((pgDataStore) => {
        if (pgDataStore) {
            var tempDataStore = {};
            var finalDataStore = {};
            pgDataStore[`data`].forEach((element) => {
                var key = element[`pgId`] + `,` + pgDataStore[`instanceFetchedFrom`];
                var value = element[`pgName`];
                tempDataStore[key] = value;
            });

            getCachedItem(`queueDataStore`).then((queueDataStore) => {
                if (queueDataStore) {
                    console.log(queueDataStore);
                    console.log(tempDataStore);
                    finalDataStore = { ...queueDataStore, ...tempDataStore };
                }
                else {
                    finalDataStore = tempDataStore;
                }

                console.log(finalDataStore);
                setCachedItem(`queueDataStore`, finalDataStore);
                document.getElementById(`clearQueue`).style.display = `block`;
                document.getElementById(`copyQueue`).style.display = `block`;

                setQueueTable(finalDataStore);
            });
        }
    });

});

/************************************************************************************************************/


document.getElementById(`getSearchResults`).addEventListener(`click`, () => {
    /*
       Search
    */
    getActiveTab().then((tabParams) => {
        var tabId = tabParams[`tabId`];
        var url = tabParams[`url`];
        var hostname = tabParams[`hostname`];
        console.log(tabId, url, hostname);
        if (tabId) {
            var messageRequest = { actionName: `getJwtToken` };
            sendMessage(tabId, messageRequest).then((messageResponse) => {
                if (messageResponse) {
                    if (messageResponse.actionName == `jwtToken`) {
                        document.getElementById(`searchResult`).innerHTML = `<br><div class="spinner-border text-light" role="status">
                                    <span class="visually-hidden">Loading...</span>
                                    </div>`;
                        var searchDataStore = {};
                        var token = JSON.parse(messageResponse.data)[`item`];
                        var url = `https://${hostname}/nifi-api/flow/search-results`;
                        var searchKeyword = document.getElementById(`searchKeyword`).value;
                        if (searchKeyword != `` && searchKeyword != undefined && searchKeyword != undefined) {
                            url = url + `?q=${searchKeyword}&a=root`;
                            var request = { "method": "GET", "headers": { "Authorization": `Bearer ${token}` } };
                            fetchData(url, request, `searchResults`).then((data) => {
                                if (data) {
                                    Object.keys(data[`searchResultsDTO`]).forEach((element) => {
                                        if (element == `processGroupResults`) {
                                            var processGroupsList = data[`searchResultsDTO`][`processGroupResults`];
                                            processGroupsList.forEach((processGroup) => {
                                                if (!Object.keys(searchDataStore).includes(processGroup[`id`])) {
                                                    searchDataStore[processGroup[`id`]] = {};
                                                    searchDataStore[processGroup[`id`]][`name`] = processGroup[`name`];
                                                    searchDataStore[processGroup[`id`]][`children`] = [];
                                                }
                                                if (!Object.keys(searchDataStore).includes(processGroup[`parentGroup`][`id`])) {
                                                    searchDataStore[processGroup[`parentGroup`][`id`]] = {};
                                                    searchDataStore[processGroup[`parentGroup`][`id`]][`name`] = processGroup[`parentGroup`][`name`];
                                                    searchDataStore[processGroup[`parentGroup`][`id`]][`children`] = [];
                                                }
                                            });

                                            processGroupsList.forEach((processGroup) => {
                                                if (Object.keys(searchDataStore).includes(processGroup[`parentGroup`][`id`])) {
                                                    var idx = processGroup[`id`];
                                                    var name = processGroup[`name`];
                                                    searchDataStore[processGroup[`parentGroup`][`id`]][`children`].push([idx, name]);
                                                }
                                            });

                                            Object.keys(searchDataStore).forEach((item) => {
                                                if (searchDataStore[item][`children`] == 0) {
                                                    delete searchDataStore[item];
                                                }
                                            });
                                        }
                                    });

                                    searchDataStore[`searchKeyword`] = searchKeyword;
                                    searchDataStore[`hostname`] = hostname;
                                    setCachedItem(`searchDataStore`, searchDataStore);

                                    setSearchTable(searchDataStore);

                                    var tempDataStore = {};
                                    Object.keys(searchDataStore).forEach((element) => {
                                        if (element != `hostname` && element != `searchKeyword`) {
                                            tempDataStore[element + `,` + searchDataStore[`hostname`]] = searchDataStore[element][`name`];
                                            searchDataStore[element][`children`].forEach((record) => {
                                                tempDataStore[record[0] + `,` + searchDataStore[`hostname`]] = record[1];
                                            });
                                        }
                                    });

                                    getCachedItem(`omniDataStore`).then((omniDataStore) => {
                                        var finalOmniDataStore = {};
                                        if (omniDataStore) {
                                            finalOmniDataStore = { ...tempDataStore, ...omniDataStore };
                                        }
                                        else {
                                            finalOmniDataStore = tempDataStore;
                                        }
                                        setCachedItem(`omniDataStore`, finalOmniDataStore);
                                    });

                                }
                            }).catch((error) => {
                                console.log(error);
                            });
                        }
                    }
                }
            }).catch((error) => {
                console.log(error);
                alert(`Reload nifi page and then try again!...`);
            });
        }
    }).catch((error) => {
        console.log(error);
        alert(`Reload nifi page and then try again!...`);
    });
});

function setSearchTable(storeObject) {
    /*
       Updating the search result table
    */

    var resultString = "";
    resultString += `<p class="p">Search results for <span style="color:#4CAAB8;"><b>${storeObject["searchKeyword"]}</b></span> in the instance <span style="color:#4CAAB8;"><b>${storeObject["hostname"]}</b></span> :</p>`;
    resultString += `<table class="table table-sm table-responsive table-bordered table-dark table-hover table-striped" id="SearchTable">`;
    resultString += `<tr class="table-info"><th>No</th>`;
    resultString += `<th>Search Results</th></tr>`;

    var rowIndex = 1;
    Object.keys(storeObject).forEach((element) => {
        if (element != "hostname" && element != "searchKeyword") {
            resultString += `<tr>`;
            resultString += `<td>${rowIndex}</td>`;
            resultString += `<td>`;
            resultString += `&nbsp;<a style="text-decoration:none; color:wheat;" target="_blank" href="https://${storeObject["hostname"]}/nifi/?processGroupId=${element}">${storeObject[element]["name"]}</a><br><br>`;
            storeObject[element]["children"].forEach((processGroup) => {
                resultString += `&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;`;
                resultString += `&bull;&nbsp;&nbsp;<a style="text-decoration:none; color:white; white-space: nowrap;" target="_blank" href="https://${storeObject["hostname"]}/nifi/?processGroupId=${element}&componentIds=${processGroup[0]}">${processGroup[1]}</a><br><br>`;
            });
            resultString += `</td></tr>`;
            rowIndex = rowIndex + 1;
        }

    });
    resultString += `</table>`;
    document.getElementById(`searchResult`).innerHTML = resultString;
    document.getElementById(`clearSearchResult`).style.display = `block`;
    document.getElementById(`copySearchResults`).style.display = `block`;
}




document.getElementById(`copySearchResults`).addEventListener(`click`, () => {
    /*
       Copies the search results to clipboard in csv format.
    */

    getCachedItem(`searchDataStore`).then((searchDataStore) => {
        if (searchDataStore) {
            var resultString = ``;
            resultString += `parent_pg_id, parent_pg_name, pg_id, pg_name\n`;
            Object.keys(searchDataStore).forEach((element) => {
                if (element != `hostname` && element != `searchKeyword`) {
                    resultString += `${element},${searchDataStore[element][`name`].toString().replaceAll(`,`, ` `)},`;
                    searchDataStore[element][`children`].forEach((flow, idx) => {
                        if (idx == 0) {
                            resultString += `${flow[0]},${flow[1].toString().replaceAll(`,`, ` `)}\n`;
                        }
                        else {
                            resultString += `,,${flow[0]},${flow[1].toString().replaceAll(`,`, ` `)}\n`;
                        }
                    });
                }
            });
            navigator.clipboard.writeText(resultString);
        }
    });
});

/************************************************************************************************************/

// getActiveTab().then((tabParams) => {
//     var tabId = tabParams[`tabId`]
//     var url = tabParams[`url`]
//     var hostname = tabParams[`hostname`];
//     console.log(tabId, url, hostname);
//     if (tabId) { // When active tab properties are successfully fetched
//         var messageRequest = { actionName: `getJwtToken` };
//         sendMessage(tabId, messageRequest).then((messageResponse) => { // Send a message to content script to fetch jwt token.
//             if (messageResponse) {
//                 if (messageResponse.actionName == `jwtToken`) {
//                     // Set the loading spinner while the below statements are executed.
//                     // document.getElementById(`processGroupsResult`).innerHTML = `<br><div class="spinner-border text-light" role="status">
//                     //             <span class="visually-hidden">Loading...</span>
//                     //             </div>`;
//                     var token = JSON.parse(messageResponse.data)[`item`]; // jwt token
//                     var parentPgId = new URL(url).searchParams.get(`processGroupId`);
//                     if (parentPgId == null || parentPgId == undefined || parentPgId == ``) { // if process group id is not present in url
//                         parentPgId = `root`; // Assume process group id as `root`
//                     }
//                     var request = {
//                         "method": "GET",
//                         "headers":
//                             { "Authorization": `Bearer ${token}` }
//                     };
//                     fetchData(`https://${hostname}/nifi-api/flow/process-groups/${parentPgId}/controller-services?includeAncestorGroups=false&includeDescendantGroups=true`,
//                         request, `controllerServices`).then((data) => {
//                             if(data)
//                             {
//                                 var controllerServicesDataStore = {};
//                                 console.log(data);
//                                 controllerServicesDataStore[`pgIdFetchedFrom`] = parentPgId;
//                                 controllerServicesDataStore[`fetchedTime`] = data[`currentTime`];
//                                 controllerServicesDataStore[`data`] = [];
//                                 data[`controllerServices`].forEach((record) => {
//                                         var tempRecord = {};
//                                         tempRecord[`id`] = record[`id`];
//                                         tempRecord[`revision`] = record[`revision`];
//                                         tempRecord[`parentPgId`] = record[`parentGroupId`];
//                                         tempRecord[`properties`] = record[`properties`];
//                                         tempRecord[`name`] = record[`name`];

//                                         var tempComponent = record[`component`];
//                                         tempRecord[`properties`] = tempComponent[`properties`];
//                                         tempRecord[`bundle`] = tempComponent[`bundle`];
//                                         tempRecord[`validationStatus`] = tempComponent[`validationStatus`];
//                                         tempRecord[`state`] = tempComponent[`state`];

//                                         controllerServicesDataStore[`data`].push(tempRecord); 
//                                 });

//                                 console.log(controllerServicesDataStore);
//                             }
//                         }).catch((error) => {
//                             console.log(error);
//                         });

//                 }
//             }
//         }).catch((error) => {
//             console.log(error);
//             alert(`Reload nifi page and then try again!...`);
//         });

//     }
// }).catch((error) => {
//     console.log(error);
//     alert(`Reload nifi page and then try again!...`);
// });