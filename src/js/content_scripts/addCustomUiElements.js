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
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#AABBC3;">
                &nbsp;&nbsp;<i class="fa fa-upload" style="color:black;"></i>
                <button id="custom_upload_to_drive" style="border :0; color:black; background-color:#AABBC3; font-weight:900;" title="Backups the selected flow's template to google drive">Upload&nbsp;to&nbsp;Google&nbsp;Drive</button>
                </div>
                <div class="clear"></div>`;
            }
        }
    });


    document.body.addEventListener(`auxclick`, (event) => {

        var element = document.querySelector(`#variable-registry-menu-item`);
        if (element != undefined && element != null) {
            document.querySelector(`#variable-registry-menu-item`).insertAdjacentHTML(`beforebegin`, html_to_inject);
        }
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
                                                                                document.getElementById(`custom_upload_to_drive`).innerText = `Upload failed!`;
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
                                                                    document.getElementById(`custom_upload_to_drive`).innerText = `Upload failed!`;
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
                                                                    console.log(error);
                                                                });

                                                        });
                                                })
                                                .catch((error) => {
                                                    console.log(error);
                                                });
                                        })
                                        .catch((error) => {
                                            console.log(error);
                                        });
                                })
                                .catch((error) => {
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