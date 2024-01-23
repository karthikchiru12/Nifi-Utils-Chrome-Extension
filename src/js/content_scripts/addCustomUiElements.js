var areCustomUIComponentsAddedToUI = false;

async function fetchWrapper(url, request, responseType, context) {
    /*
       Using fetch() sends the provided request and returns the corresponding response.

       parameters
       --------------------
       url : String
       request : Object
       responseType : String
       context : String

       returns
       --------------------
       response : Promise

                   Returns data if fetch() call is successful.
                   Returns the value false, if it fails.
    */
    try {
        var response = await fetch(url, request);
        if (response.status == 200 || response.status == 201) {
            var data;
            console.log(`Request successful : ${context}`);
            if (responseType == "json") {
                data = await response.json();
            }
            else {
                data = await response.text();
            }
            return data;
        }
        else {
            if (response.status == 401) {
                if (context == `uploadFileToDrive` || context == `renameFileInDrive`) {
                    chrome.storage.local.set({ "loggedIn": "false" }, () => {
                        console.log("Saved!");
                    });
                }
            }
            console.log(`Request failed : ${context} : ${response.status}`);
            return false;
        }
    }
    catch (error) {
        console.log(`Request failed : ${context}`);
        return false;
    }
}

/************************************************************************************************************/
// EXPERIMENTAL feature
function addServiceInfoDetails() {
    try {
        // node to observe for changes
        const targetNode = document.getElementById('canvas-body');

        // observer config
        const config = { childList: true, subtree: true };

        // callback when there are changes to observed nodes
        const serviceInfoCallback = (mutationList, observer) => {
            for (const mutation of mutationList) {
                if (mutation.type === 'childList') {
                    if (mutation.previousSibling) {
                        if (mutation.previousSibling.className == `combo-editor ui-draggable ui-draggable-handle`) {
                            if (mutation.addedNodes.length != 0) {
                                Array.from(document.querySelector("#canvas-body > div.combo-options > ul").getElementsByTagName("li")).forEach((element) => {
                                    var controllerServiceId = element.getElementsByClassName('hidden')[0].textContent;
                                    if (controllerServiceId != null && controllerServiceId != undefined & controllerServiceId != "") {
                                        element.getElementsByClassName('combo-option-text')[0].insertAdjacentHTML(`afterbegin`, `<div class="fa fa-question-circle" alt="Info" id="${controllerServiceId}" title="controllerServicesInfo"></div>&nbsp;&nbsp;&nbsp;&nbsp;`);
                                    }
                                });
                            }
                        }
                    }
                } else if (mutation.type === 'attributes') {
                    console.log(`The ${mutation.attributeName} attribute was modified.`);
                }
            }
        };

        // create an observer
        const observer = new MutationObserver(serviceInfoCallback);

        //observe the target node for changes
        observer.observe(targetNode, config);

        document.addEventListener('mouseover', (event) => {
            if (event.target.title == 'controllerServicesInfo') {
                var resultObject = {};
                var token = JSON.parse(localStorage.getItem("jwt"))["item"];
                var url = window.location.href;
                var hostname = new URL(url).hostname.toString();
                var id = event.target.id;
                document.getElementById(id).title = 'loading...!';

                var getServiceInfoRequest = {
                    "method": "GET",
                    "headers":
                    {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                };

                fetchWrapper(`https://${hostname}/nifi-api/controller-services/${id}`, getServiceInfoRequest,
                    `json`, `getServiceInfo`).then((controllerServiceData) => {
                        if (controllerServiceData) {

                            resultObject[`status`] = controllerServiceData[`status`];
                            resultObject[`properties`] = controllerServiceData[`component`][`properties`];

                            var parentGroupId = controllerServiceData[`parentGroupId`];

                            var getProcessGroupDetailsRequest =
                            {
                                "method": "GET",
                                "headers":
                                {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                }
                            };

                            fetchWrapper(`https://${hostname}/nifi-api/process-groups/${parentGroupId}`, getProcessGroupDetailsRequest,
                                `json`, `getProcessGroupName`).then((processGroupData) => {
                                    if (processGroupData) {
                                        var scopeProcessGroupName = processGroupData[`component`][`name`];

                                        resultObject[`scope`] = scopeProcessGroupName;

                                        document.getElementById(id).title = JSON.stringify(resultObject);
                                    }
                                    else {
                                        document.getElementById(id).title = `Either not a controller service or the controller service is not found.`;
                                    }
                                });
                        }
                        else {
                            document.getElementById(id).title = `Either not a controller service or the controller service is not found.`;
                            console.log(`Data for given controller service with ${id} not found.`);
                        }

                    })
                    .catch((error) => {
                        console.log(error);
                    });
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}

/************************************************************************************************************/

try {
    var html_to_inject = ``;
    chrome.storage.local.get([`optionsDataStore`], (item) => {
        var optionsDataStore = item[`optionsDataStore`];
        if (optionsDataStore != null && optionsDataStore != undefined) {
            if (optionsDataStore[`copy_jwt_token_component`] == `enabled`) {
                document.querySelector(`#component-container`).insertAdjacentHTML(`beforeend`, `
                &nbsp;&nbsp;
                <div style="color:black; display:inline;">
                <div class="fa fa-key" style="color:black;" id="custom-banner-copy-jwt-token" title="Copies the jwt token"></div>
                </div>`);
            }
            if (optionsDataStore[`copy_link_component`] == `enabled`) {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3; border-bottom:solid 1px black;">
                &nbsp;&nbsp;<i class="fa fa-share" style="color:black;"></i>
                <button id="custom-copy-flow-link" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Copies the flow link to clipboard">Copy&nbsp;link</button>
                </div>
                <div class="clear"></div>`;
            }
            if (optionsDataStore[`enable_all_controller_services_component`] == `enabled`) {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3; border-bottom:solid 1px black;">
                &nbsp;&nbsp;<i class="fa fa-bolt" style="color:black;"></i>
                <button id="custom-enable-all-controller-services" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Enables all the controller services in the scope">Enable&nbsp;all&nbsp;controller&nbsp;services</button>
                </div>
                <div class="clear"></div>`;
            }
            if (optionsDataStore[`disable_all_controller_services_component`] == `enabled`) {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3; border-bottom:solid 1px black;">
                &nbsp;&nbsp;<i class="icon icon-enable-false" style="color:black;"></i>
                <button id="custom-disable-all-controller-services" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Disables all the controller services in the scope">Disable&nbsp;all&nbsp;controller&nbsp;services</button>
                </div>
                <div class="clear"></div>`;
            }
            if (optionsDataStore[`upload_to_drive_component`] == `enabled`) {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3; border-bottom:solid 1px black;">
                &nbsp;&nbsp;<i class="fa fa-upload" style="color:black;"></i>
                <button id="custom_upload_to_drive" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Backups the selected flow's template to google drive">Upload&nbsp;to&nbsp;Google&nbsp;Drive</button>
                </div>
                <div class="clear"></div>`;
            }
            if (optionsDataStore[`live_jvm_metrics_component`] == `enabled`) {
                document.querySelector("#graph-controls").insertAdjacentHTML("beforeend", `<div id="live-jvm-metrics" style="user-select: none;color:black;">
                <div style="margin:5px;" class="fa fa-bar-chart">
                </div>
                <h1 style="margin:5px; font-size:20px;font-weight:500;">JVM Metrics</h1>
                <p style="margin:5px;">Added using <span style="font-size:15px;color:teal;font-weight:900;">Nifi Utils</span></p>
                <br>
                <div style="margin:5px;font-size:12px;">
                    <p id="live-last-updated">Last Updated : </p>
                    <p id="live-uptime">Uptime : </p>
                    <p id="live-heap-percentage">Heap % : </p>
                    <p id="live-free-heap">Free heap : </p>
                    <p id="live-used-heap">Used heap : </p>
                    <p id="live-max-heap">Max heap : </p>
                    <p id="live-cores">Cores : </p>
                    <p id="live-load-average">Average Load : </p>
                </div>
                </div>`);
                addLiveJvmMetrics();
            }
            if (optionsDataStore[`copy_flow_component`] == `enabled`) {
                chrome.storage.local.get(["dataFlowStore"], (item) => {
                    var dataFlowStore = item["dataFlowStore"];
                    if (dataFlowStore == null && dataFlowStore == undefined) {
                        // When dataFlowStore is empty
                        html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3; border-bottom:solid 1px black;">
                        &nbsp;&nbsp;<i class="fa fa-upload" style="color:black;"></i>
                        <button id="copy_flow_to_cache" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Backups the selected flows template to extension cache">Copy&nbsp;Flow</button>
                        </div>
                        <div class="clear"></div>`;
                    }
                    else {
                        // When there is data in dataFlowStore
                        html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3; border-bottom:solid 1px black;">
                        &nbsp;&nbsp;<i class="fa fa-upload" style="color:black;"></i>
                        <button id="paste_flow_from_cache" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Paste the flow to current instance">Paste&nbsp;Flow</button>
                        </div>
                        <div class="clear"></div>`;
                    }
                });
            }
            if (optionsDataStore[`service_info_component`] == `enabled`) {
                addServiceInfoDetails();
            }
        }
    });


    document.body.addEventListener(`auxclick`, (event) => {

        var element = document.querySelector(`#variable-registry-menu-item`);
        if (element != undefined && element != null && areCustomUIComponentsAddedToUI == false) {
            chrome.storage.local.get(["dataFlowStore"], (item) => {
                var dataFlowStore = item["dataFlowStore"];
                if (dataFlowStore != null && dataFlowStore != undefined) {
                    html_to_inject = html_to_inject.replace("copy_flow_to_cache", "paste_flow_from_cache");
                    html_to_inject = html_to_inject.replace("Copy&nbsp;Flow", "Paste&nbsp;Flow");
                    html_to_inject = html_to_inject.replace("Backups the selected flow's template to extension cache", "Paste the flow to current instance");
                }
                else {
                    html_to_inject = html_to_inject.replace("paste_flow_from_cache", "copy_flow_to_cache");
                    html_to_inject = html_to_inject.replace("Paste&nbsp;Flow", "Copy&nbsp;Flow");
                    html_to_inject = html_to_inject.replace("BPaste the flow to current instance", "Backups the selected flow's template to extension cache");
                }
                areCustomUIComponentsAddedToUI = true;
                document.querySelector(`#variable-registry-menu-item`).insertAdjacentHTML(`beforebegin`, html_to_inject);
            });
        }
    });

    // Renable the custom UI components after a left or right click
    document.body.addEventListener('click', (event) => {
        areCustomUIComponentsAddedToUI = false;
    });

    document.body.addEventListener('contextmenu', (event) => {
        areCustomUIComponentsAddedToUI = false;
    });

    document.addEventListener(`click`, (event) => {
        if (event.target.id == `custom-copy-flow-link`) {
            navigator.clipboard.writeText(window.location.href);
            document.getElementById(`custom-copy-flow-link`).innerHTML = `Link&nbsp;copied!`;
            document.getElementById(`custom-copy-flow-link`).style.color = `darkgreen`;
        }
    });

    document.addEventListener(`click`, (event) => {
        if (event.target.id == `custom-banner-copy-jwt-token`) {
            var tokenObj = JSON.parse(localStorage.getItem(`jwt`));
            navigator.clipboard.writeText(tokenObj[`item`]);
            var tokenExpiryTime = new Date(tokenObj[`expires`]).toUTCString();
            alert(`Token Copied!\nToken expires at ${tokenExpiryTime}`);
        }

    });

    document.addEventListener(`click`, (event) => {
        if (event.target.id == `custom-enable-all-controller-services`) {
            changeStateOfAllControllerServices(`ENABLED`);
        }

    });

    document.addEventListener("click", (event) => {
        if (event.target.id == "custom-disable-all-controller-services") {
            changeStateOfAllControllerServices("DISABLED");
        }

    });

    document.addEventListener(`click`, (event) => {
        if (event.target.id == `custom_upload_to_drive`) {
            var token = JSON.parse(localStorage.getItem("jwt"))["item"];
            var url = window.location.href;
            var hostname = new URL(url).hostname.toString();
            var params = new URL(url).searchParams;
            var pgId = params.get("processGroupId");
            var componentId = params.get("componentIds");
            var id;
            console.log(params.get("processGroupId"));
            console.log(params.get("componentIds"));
            if ((pgId == "root" || pgId == undefined || pgId == null || pgId == "") && (componentId == "" || componentId == undefined || componentId == null)) {
                alert("Please select a process group to backup");
            }
            else {
                chrome.storage.local.get([`loggedIn`], (item) => {
                    var loggedIn = item[`loggedIn`];
                    if (loggedIn != null && loggedIn != undefined) {
                        if (loggedIn == "true") {
                            if (componentId != "" && componentId != undefined && componentId != null) {
                                id = componentId;
                            }
                            else {
                                id = pgId;
                            }
                            var getProcessGroupDetailsRequest =
                            {
                                "method": "GET",
                                "headers":
                                {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                }
                            }
                            // Even Im not proud of this messy nested fetch block, Need to work on my promises knowledge
                            fetchWrapper(`https://${hostname}/nifi-api/process-groups/${id}`, getProcessGroupDetailsRequest,
                                "json", "processGroupDetails")
                                .then((processGroupData) => {
                                    // Getting selected process group details
                                    document.getElementById(`custom_upload_to_drive`).innerText = `Getting_details...`;
                                    var uploadParentPgId = processGroupData[`component`][`parentGroupId`].toString();
                                    var uploadPgId = processGroupData[`component`][`id`].toString();
                                    var uploadPgVersion = processGroupData[`revision`][`version`].toString();
                                    var uploadPgName = processGroupData[`component`][`name`];

                                    var createSnippetRequestBody = {
                                        "snippet": {
                                            "parentGroupId": uploadParentPgId,
                                            "processGroups": {}
                                        }
                                    };
                                    createSnippetRequestBody[`snippet`][`processGroups`][uploadPgId] = {
                                        "clientId": crypto.randomUUID(),
                                        "version": uploadPgVersion
                                    };
                                    var createSnippetRequest = {
                                        "method": "POST",
                                        "headers":
                                        {
                                            "Authorization": `Bearer ${token}`,
                                            "Content-Type": "application/json"
                                        },
                                        "body": JSON.stringify(createSnippetRequestBody)

                                    };

                                    // Creating a snippet
                                    fetchWrapper(`https://${hostname}/nifi-api/snippets`, createSnippetRequest,
                                        "json", "createSnippet").then((snippetData) => {
                                            document.getElementById(`custom_upload_to_drive`).innerText = `Creating_snippet...`;
                                            var snippetId = snippetData[`snippet`][`id`].toString();
                                            var templateName = `${hostname} && ${uploadPgId} && ${uploadPgName} && ${new Date().getTime()} && ${uploadPgVersion}`;
                                            var createTemplateRequest =
                                            {
                                                "method": "POST",
                                                "headers":
                                                {
                                                    "Authorization": `Bearer ${token}`,
                                                    "Content-Type": "application/json"
                                                },
                                                "body": JSON.stringify({
                                                    "name": templateName,
                                                    "snippetId": snippetId,
                                                })
                                            };
                                            // Creating a template
                                            fetchWrapper(`https://${hostname}/nifi-api/process-groups/root/templates`, createTemplateRequest,
                                                "json", "createTemplate")
                                                .then((templateData) => {
                                                    document.getElementById(`custom_upload_to_drive`).innerText = `Creating_template...`;

                                                    var templateId = templateData[`template`][`id`].toString();
                                                    var templateDownloadRequest =
                                                    {
                                                        "method": "GET",
                                                        "headers":
                                                        {
                                                            "Authorization": `Bearer ${token}`,
                                                            "Content-Type": "application/json"
                                                        }
                                                    };
                                                    // Downloading the template
                                                    fetchWrapper(`https://${hostname}/nifi-api/templates/${templateId}/download`, templateDownloadRequest,
                                                        "text", "downloadTemplate")
                                                        .then((templateXml) => {
                                                            document.getElementById(`custom_upload_to_drive`).innerText = `Getting_template...`;


                                                            chrome.storage.local.get([`oAuthToken`], (item) => {
                                                                var oAuthToken = item[`oAuthToken`];
                                                                if (oAuthToken != null && oAuthToken != undefined) {
                                                                    var uploadFileToDriveRequest =
                                                                    {
                                                                        "method": "POST",
                                                                        "headers":
                                                                        {
                                                                            "Authorization": `Bearer ${oAuthToken}`,
                                                                            "Content-Type": "application/xml"
                                                                        },
                                                                        "body": templateXml
                                                                    };

                                                                    fetchWrapper(`https://www.googleapis.com/upload/drive/v3/files?uploadType=media`, uploadFileToDriveRequest,
                                                                        "json", "uploadFileToDrive")
                                                                        .then((fileData) => {
                                                                            if (fileData) {
                                                                                document.getElementById(`custom_upload_to_drive`).innerText = `Uploading...`;
                                                                                var fileId = fileData.id;
                                                                                var renameFileInDriveRequest =
                                                                                {
                                                                                    "method": "PATCH",
                                                                                    "headers":
                                                                                    {
                                                                                        "Authorization": `Bearer ${oAuthToken}`,
                                                                                        "Content-Type": "application/json"
                                                                                    },
                                                                                    "body": JSON.stringify({
                                                                                        "name": templateName + `.xml`
                                                                                    })
                                                                                };
                                                                                fetchWrapper(`https://www.googleapis.com/drive/v3/files/${fileId}`, renameFileInDriveRequest,
                                                                                    "json", "renameFileInDrive")
                                                                                    .then((data) => {
                                                                                        if (data) {
                                                                                            console.log(data);
                                                                                            document.getElementById(`custom_upload_to_drive`).innerText = `Done...`;
                                                                                            alert("Flow successfully backed up to your google drive!.");
                                                                                        }
                                                                                        else {
                                                                                            alert(`Please sign in again!...`);
                                                                                        }
                                                                                    })
                                                                                    .catch((error) => {
                                                                                        console.log(error);
                                                                                    });
                                                                            }
                                                                            else {
                                                                                document.getElementById(`custom_upload_to_drive`).innerText = `Upload_failed!`;
                                                                                alert(`Please sign in again!...`);
                                                                            }

                                                                        }).catch((error) => {
                                                                            console.log(error);
                                                                        });
                                                                }
                                                                else {
                                                                    chrome.storage.local.set({ "loggedIn": "false" }, () => {
                                                                        console.log("Saved!");
                                                                    });
                                                                    alert(`Please sign in again!...`);
                                                                    document.getElementById(`custom_upload_to_drive`).innerText = `Upload_failed!`;
                                                                }
                                                            });


                                                            var deleteTemplateRequest =
                                                            {
                                                                "method": "DELETE",
                                                                "headers":
                                                                {
                                                                    "Authorization": `Bearer ${token}`,
                                                                    "Content-Type": "application/json"
                                                                }
                                                            };

                                                            fetchWrapper(`https://${hostname}/nifi-api/templates/${templateId}`, deleteTemplateRequest,
                                                                "json", "deleteTemplate")
                                                                .then((data) => {
                                                                    console.log(data);
                                                                })
                                                                .catch((error) => {
                                                                    alert(`Deleting the temporarily created template failed. Please check if you have necessary permissions to do this operation.`);
                                                                    console.log(error);
                                                                });

                                                        });
                                                })
                                                .catch((error) => {
                                                    alert(`Creating template. Please check if you have necessary permissions to do this operation`);
                                                    console.log(error);
                                                });
                                        })
                                        .catch((error) => {
                                            alert(`Creating snippet failed. Please check if you have necessary permissions to do this operation`);
                                            console.log(error);
                                        });
                                })
                                .catch((error) => {
                                    alert(`Getting process groups failed. Please check if you have necessary permissions to do this operation`);
                                    console.log(error);
                                });
                        }
                        else {
                            alert(`You need to login to use this feature!...`);
                        }
                    }
                    else {
                        alert(`You need to login to use this feature!...`);
                    }
                });
            }
        }
    });

    function changeStateOfAllControllerServices(state) {
        var keywords;
        if (state == "ENABLED") {
            keywords = "Enabling,ENABLE";
        }
        else {
            keywords = "Disabling,DISABLE";
        }
        var token = JSON.parse(localStorage.getItem("jwt"))["item"];
        var url = window.location.href;
        var hostname = new URL(url).hostname.toString();
        var params = new URL(url).searchParams;
        var pgId = params.get("processGroupId");
        var componentId = params.get("componentIds");
        console.log(params.get("processGroupId"));
        console.log(params.get("componentIds"));
        if (pgId == "root" || pgId == undefined || pgId == null || pgId == "") {
            alert(`ENABLING/DISABLING the controller services\nAt the ROOT level is **FORBIDDEN**.\nPlease be mindful while using this option!..`);
        }
        else {
            var promptResponse = prompt(`Please type ${keywords.split(",")[1]}\n`);
            if (promptResponse == keywords.split(",")[1]) {
                async function changeState(id) {
                    console.log(id);
                    const url = `https://${hostname}/nifi-api/flow/process-groups/${id}/controller-services`;
                    const response = await fetch(url, {
                        "method": "PUT",
                        "headers":
                        {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        "body": JSON.stringify({
                            "id": id,
                            "state": state
                        })
                    });
                    if (response.status == 200) {
                        alert(`Successfully ${keywords.split(",")[1]}D all the controller services in this scope.`);
                    }
                    else {
                        alert(`${keywords.split(",")[0]} controller services failed with response ${response.status}`);

                    }
                }
                if (componentId == "") {
                    changeState(pgId.toString());
                }
                else {
                    changeState(componentId.toString());
                }
            }
            else {
                alert(`Please type ENABLE/DISABLE(Case-sensitive) correctly again to proceed forward`);
            }
        }
    }

    console.log("Nifi Utils - addCustomUiElements: Content Script is successfully injected.");
}
catch (error) {
    alert(`Reload and try again`);
    console.log(error);
}

/************************************************************************************************************/

document.addEventListener(`click`, (event) => {
    if (event.target.id == `copy_flow_to_cache`) {
        var token = JSON.parse(localStorage.getItem("jwt"))["item"];
        var url = window.location.href;
        var hostname = new URL(url).hostname.toString();
        var params = new URL(url).searchParams;
        var pgId = params.get("processGroupId");
        var componentId = params.get("componentIds");
        var id;
        console.log(params.get("processGroupId"));
        console.log(params.get("componentIds"));
        if ((pgId == "root" || pgId == undefined || pgId == null || pgId == "") && (componentId == "" || componentId == undefined || componentId == null)) {
            alert("Please select a process group to store in cache");
        }
        else {
            if (componentId != "" && componentId != undefined && componentId != null) {
                id = componentId;
            }
            else {
                id = pgId;
            }
            var getProcessGroupDetailsRequest =
            {
                "method": "GET",
                "headers":
                {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
            // Well what can I say, Im a Lousy dev,so copy pasting from above. Still didn`t learn promises.
            fetchWrapper(`https://${hostname}/nifi-api/process-groups/${id}`, getProcessGroupDetailsRequest,
                "json", "processGroupDetails")
                .then((processGroupData) => {
                    // Getting selected process group details
                    document.getElementById(`copy_flow_to_cache`).innerText = `Getting_details...`;
                    var uploadParentPgId = processGroupData[`component`][`parentGroupId`].toString();
                    var uploadPgId = processGroupData[`component`][`id`].toString();
                    var uploadPgVersion = processGroupData[`revision`][`version`].toString();
                    var uploadPgName = processGroupData[`component`][`name`];

                    var createSnippetRequestBody = {
                        "snippet": {
                            "parentGroupId": uploadParentPgId,
                            "processGroups": {}
                        }
                    };
                    createSnippetRequestBody[`snippet`][`processGroups`][uploadPgId] = {
                        "clientId": crypto.randomUUID(),
                        "version": uploadPgVersion
                    };
                    var createSnippetRequest = {
                        "method": "POST",
                        "headers":
                        {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        },
                        "body": JSON.stringify(createSnippetRequestBody)

                    };

                    // Creating a snippet
                    fetchWrapper(`https://${hostname}/nifi-api/snippets`, createSnippetRequest,
                        "json", "createSnippet").then((snippetData) => {
                            document.getElementById(`copy_flow_to_cache`).innerText = `Creating_snippet...`;
                            var snippetId = snippetData[`snippet`][`id`].toString();
                            var templateName = `${hostname} && ${uploadPgId} && ${uploadPgName} && ${new Date().getTime()} && ${uploadPgVersion}`;
                            var createTemplateRequest =
                            {
                                "method": "POST",
                                "headers":
                                {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                },
                                "body": JSON.stringify({
                                    "name": templateName,
                                    "snippetId": snippetId,
                                })
                            };
                            // Creating a template
                            fetchWrapper(`https://${hostname}/nifi-api/process-groups/root/templates`, createTemplateRequest,
                                "json", "createTemplate")
                                .then((templateData) => {
                                    document.getElementById(`copy_flow_to_cache`).innerText = `Creating_template...`;

                                    var templateId = templateData[`template`][`id`].toString();
                                    var templateDownloadRequest =
                                    {
                                        "method": "GET",
                                        "headers":
                                        {
                                            "Authorization": `Bearer ${token}`,
                                            "Content-Type": "application/json"
                                        }
                                    };
                                    // Downloading the template
                                    fetchWrapper(`https://${hostname}/nifi-api/templates/${templateId}/download`, templateDownloadRequest,
                                        "text", "downloadTemplate")
                                        .then((templateXml) => {
                                            document.getElementById(`copy_flow_to_cache`).innerText = `Getting_template...`;
                                            var dataFlowStoreObj = {};
                                            dataFlowStoreObj["templateName"] = templateName;
                                            dataFlowStoreObj["templateData"] = templateXml;
                                            chrome.storage.local.set({ "dataFlowStore": dataFlowStoreObj }, () => {
                                                console.log("Saved!");
                                                document.getElementById(`copy_flow_to_cache`).innerText = `Saved_template...`;
                                                alert("Saved the template to cache successfully!...");
                                            });

                                            var deleteTemplateRequest =
                                            {
                                                "method": "DELETE",
                                                "headers":
                                                {
                                                    "Authorization": `Bearer ${token}`,
                                                    "Content-Type": "application/json"
                                                }
                                            };

                                            fetchWrapper(`https://${hostname}/nifi-api/templates/${templateId}`, deleteTemplateRequest,
                                                "json", "deleteTemplate")
                                                .then((data) => {
                                                    console.log(data);
                                                })
                                                .catch((error) => {
                                                    alert(`Removing the temporarily created template failed. Please check if you have necessary permissions to do this operation`);
                                                    console.log(error);
                                                });

                                        });
                                })
                                .catch((error) => {
                                    alert(`Creating template failed. Please check if you have necessary permissions to do this operation`);
                                    console.log(error);
                                });
                        })
                        .catch((error) => {
                            alert(`Creating a snippet failed. Please check if you have necessary permissions to do this operation`);
                            console.log(error);
                        });
                })
                .catch((error) => {
                    alert(`Getting process groups failed. Please check if you have necessary permissions to do this operation`);
                    console.log(error);
                });
        }
    }
});

/************************************************************************************************************/


document.addEventListener(`click`, (event) => {
    if (event.target.id == `paste_flow_from_cache`) {
        var token = JSON.parse(localStorage.getItem("jwt"))["item"];
        var url = window.location.href;
        var hostname = new URL(url).hostname.toString();
        var params = new URL(url).searchParams;
        var pgId = params.get("processGroupId");
        var componentId = params.get("componentIds");
        var id;
        console.log(params.get("processGroupId"));
        console.log(params.get("componentIds"));
        if ((pgId == "root" || pgId == undefined || pgId == null || pgId == "") && (componentId == "" || componentId == undefined || componentId == null)) {
            alert("Please select a process group import the template");
        }
        else {
            if (componentId != "" && componentId != undefined && componentId != null) {
                id = componentId;
            }
            else {
                id = pgId;
            }
            // What happens twice, also happens thrice

            chrome.storage.local.get(["dataFlowStore"], (item) => {
                var dataFlowStore = item["dataFlowStore"];
                if (dataFlowStore != null && dataFlowStore != undefined) {
                    document.getElementById(`paste_flow_from_cache`).innerText = `Uploading_template...`;
                    let formData = new FormData();
                    formData.append("template", new Blob([dataFlowStore["templateData"]], { type: 'text/xml' }), dataFlowStore["templateName"]);

                    var uploadTemplateRequest =
                    {
                        "method": "POST",
                        "headers":
                        {
                            "Authorization": `Bearer ${token}`,
                            'Content-Disposition': 'attachment'
                        },
                        "body": formData
                    };

                    // Uploading template
                    fetchWrapper(`https://${hostname}/nifi-api/process-groups/root/templates/upload`, uploadTemplateRequest,
                        "formData", "uploadTemplate").then((templateData) => {
                            document.getElementById(`paste_flow_from_cache`).innerText = `Importing_template...`;
                            console.log(templateData);
                            const templateIdRegexp = /<id>(.*?)<\/id>/;
                            const templateId = templateIdRegexp.exec(templateData)[1];
                            const encodingVersionRegexp = /<template encoding-version="(.*?)">/;
                            const encodingVersion = encodingVersionRegexp.exec(templateData)[1];
                            console.log(templateId, encodingVersion);

                            var instantiateTemplateRequest =
                            {
                                "method": "POST",
                                "headers":
                                {
                                    "Authorization": `Bearer ${token}`,
                                    "Content-Type": "application/json"
                                },
                                "body": JSON.stringify({
                                    templateId: templateId,
                                    encodingVersion: parseFloat(encodingVersion),
                                    "originX": -1000,
                                    "originY": 500
                                })
                            };

                            chrome.storage.local.remove(["dataFlowStore"], () => {
                                var error = chrome.runtime.lastError;
                                if (error) {
                                    console.error(error);
                                }
                            });

                            // Instantiating a template
                            fetchWrapper(`https://${hostname}/nifi-api/process-groups/${id}/template-instance`, instantiateTemplateRequest,
                                "json", "InstantiatingTemplate")
                                .then((templateData) => {
                                    document.getElementById(`paste_flow_from_cache`).innerText = `Template_Added...`;
                                    alert("Template added successfully");

                                    var deleteTemplateRequest =
                                    {
                                        "method": "DELETE",
                                        "headers":
                                        {
                                            "Authorization": `Bearer ${token}`,
                                            "Content-Type": "application/json"
                                        }
                                    };

                                    fetchWrapper(`https://${hostname}/nifi-api/templates/${templateId}`, deleteTemplateRequest,
                                        "json", "deleteTemplate")
                                        .then((data) => {
                                            console.log(data);
                                        })
                                        .catch((error) => {
                                            alert(`Deleting the temporarily created template failed. Please check if you have necessary permissions to do this operation`);
                                            console.log(error);
                                        });

                                })
                                .catch((error) => {
                                    chrome.storage.local.remove(["dataFlowStore"], () => {
                                        var error = chrome.runtime.lastError;
                                        if (error) {
                                            console.error(error);
                                        }
                                    });
                                    alert(`Instantiating the template failed. Please check if you have necessary permissions to do this operation`);
                                    console.log(error);
                                });
                        })
                        .catch((error) => {
                            chrome.storage.local.remove(["dataFlowStore"], () => {
                                var error = chrome.runtime.lastError;
                                if (error) {
                                    console.error(error);
                                }
                            });
                            alert(`Uploading the template failed. Please check if you have necessary permissions to do this operation`);
                            console.log(error);
                        });
                }
            });
        }
    }
});

/************************************************************************************************************/

function addLiveJvmMetrics() {
    try {
        var refresh_interval_value = "5";
        chrome.storage.local.get(["optionsDataStore"], (item) => {
            var optionsDataStore = item["optionsDataStore"];
            if (optionsDataStore != null && optionsDataStore != undefined) {
                refresh_interval_value = optionsDataStore["live_jvm_metrics_refresh_interval"];
                setInterval(() => {
                    console.log(new Date());
                    var token = JSON.parse(localStorage.getItem("jwt"))["item"];
                    var url = window.location.href;
                    var hostname = new URL(url).hostname.toString();
                    var systemDiagnosticsRequest = {
                        "method": "GET",
                        "headers":
                        {
                            "Authorization": `Bearer ${token}`,
                            "Content-Type": "application/json"
                        }
                    }
                    fetchWrapper(`https://${hostname}/nifi-api/system-diagnostics`, systemDiagnosticsRequest,
                        "json", "systemDiagnostics").then((data) => {
                            var heapUtilization = data["systemDiagnostics"]["aggregateSnapshot"]["heapUtilization"];
                            var uptime = data["systemDiagnostics"]["aggregateSnapshot"]["uptime"];
                            var maxHeap = data["systemDiagnostics"]["aggregateSnapshot"]["maxHeap"];
                            var usedHeap = data["systemDiagnostics"]["aggregateSnapshot"]["usedHeap"];
                            var freeHeap = data["systemDiagnostics"]["aggregateSnapshot"]["freeHeap"];
                            var availableProcessors = data["systemDiagnostics"]["aggregateSnapshot"]["availableProcessors"];
                            var processorLoadAverage = data["systemDiagnostics"]["aggregateSnapshot"]["processorLoadAverage"];
                            var statsLastRefreshed = data["systemDiagnostics"]["aggregateSnapshot"]["statsLastRefreshed"];
                            document.getElementById("live-heap-percentage").innerHTML = `Heap % : ${heapUtilization}`;
                            document.getElementById("live-last-updated").innerHTML = `Last Updated : ${statsLastRefreshed}`;
                            document.getElementById("live-uptime").innerHTML = `Uptime : ${uptime}`;
                            document.getElementById("live-free-heap").innerHTML = `Free heap : ${freeHeap}`;
                            document.getElementById("live-max-heap").innerHTML = `Max heap : ${maxHeap}`;
                            document.getElementById("live-used-heap").innerHTML = `Used heap : ${usedHeap}`;
                            document.getElementById("live-load-average").innerHTML = `Average Load : ${processorLoadAverage}`;
                            document.getElementById("live-cores").innerHTML = `Cores: ${availableProcessors}`;
                        }).catch((error) => {
                            console.log(error);
                        });
                }, parseInt(refresh_interval_value) * 1000);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}
/************************************************************************************************************/