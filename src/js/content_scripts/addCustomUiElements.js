try {
    var html_to_inject = ``;
    chrome.storage.local.get(["options_data_store"], (item) => {
        var itemValue = item["options_data_store"];
        if (itemValue != null && itemValue != undefined) {
            if (itemValue["copy_jwt_token_component"] == "enabled") {
                document.querySelector("#component-container").insertAdjacentHTML('beforeend', `
                &nbsp;&nbsp;
                <div style="color:black; display:inline;">
                <div class="fa fa-key" style="color:black;" id="custom-banner-copy-jwt-token" title="Copies the jwt token"></div>
                </div>`);
            }
            if (itemValue["copy_link_component"] == "enabled") {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#4CAAB8; border-bottom:solid 1px black;">
                &nbsp;&nbsp;<i class="fa fa-share" style="color:black;"></i>
                <button id="custom-copy-flow-link" style="border :0; color:black; background-color:#4CAAB8; font-weight:900;" title="Copies the flow link to clipboard">Copy&nbsp;link</button>
                </div>
                <div class="clear"></div>`;
            }
            if (itemValue["enable_all_controller_services_component"] == "enabled") {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#4CAAB8; border-bottom:solid 1px black;">
                &nbsp;&nbsp;<i class="fa fa-bolt" style="color:black;"></i>
                <button id="custom-enable-all-controller-services" style="border :0; color:black; background-color:#4CAAB8; font-weight:900;" title="Enables all the controller services in the scope">Enable&nbsp;all&nbsp;controller&nbsp;services</button>
                </div>
                <div class="clear"></div>`;
            }
            if (itemValue["disable_all_controller_services_component"] == "enabled") {
                html_to_inject += `<div id="custom-context-menu-item" style="background-color:#4CAAB8;">
                &nbsp;&nbsp;<i class="icon icon-enable-false" style="color:black;"></i>
                <button id="custom-disable-all-controller-services" style="border :0; color:black; background-color:#4CAAB8; font-weight:900;" title="Disables all the controller services in the scope">Disable&nbsp;all&nbsp;controller&nbsp;services</button>
                </div>
                <div class="clear"></div>`;
            }
        }
    });


    document.body.addEventListener("auxclick", (event) => {

        var element = document.querySelector("#variable-registry-menu-item");
        if (element != undefined && element != null) {
            document.querySelector("#variable-registry-menu-item").insertAdjacentHTML(`beforebegin`, html_to_inject);
        }
    });

    document.addEventListener("click", (event) => {
        if (event.target.id == "custom-copy-flow-link") {
            navigator.clipboard.writeText(window.location.href);
            document.getElementById("custom-copy-flow-link").innerHTML = "Link&nbsp;copied!";
            document.getElementById("custom-copy-flow-link").style.color = "#DDFFE7";
        }
    });

    document.addEventListener("click", (event) => {
        if (event.target.id == "custom-banner-copy-jwt-token") {
            var token_obj = JSON.parse(localStorage.getItem("jwt"));
            navigator.clipboard.writeText(token_obj["item"]);
            var token_expiry_time = new Date(token_obj["expires"]).toUTCString();
            alert(`Token Copied!\nToken expires at ${token_expiry_time}`);
        }

    });

    document.addEventListener("click", (event) => {
        if (event.target.id == "custom-enable-all-controller-services") {
            change_controller_service_state("ENABLED");
        }

    });

    function change_controller_service_state(state) {
        var keywords;
        if(state == "ENABLED")
        {
            keywords = "Enabling,ENABLE";
        }
        else
        {
            keywords = "Disabling,DISABLE";
        }
        var token = JSON.parse(localStorage.getItem("jwt"))["item"];
        var url = window.location.href;
        var params = new URL(url).searchParams;
        var pg_id = params.get("processGroupId");
        var component_id = params.get("componentIds");
        console.log(params.get("processGroupId"));
        console.log(params.get("componentIds"));
        if (pg_id == "root" || pg_id == undefined || pg_id == null || pg_id == "") {
            alert(`ENABLING/DISABLING the controller services\nAt the ROOT level is **FORBIDDEN**.\nPlease be mindful while using this option!..`);
        }
        else {
            var propmpt_response = prompt(`Please type ${keywords.split(",")[1]}\n`);
            if (propmpt_response == keywords.split(",")[1]) {
                async function change_state_of_controller_services(id) {
                    console.log(id);
                    const url = window.location.href.toString().split("/nifi")[0] + `/nifi-api/flow/process-groups/${id}/controller-services`;
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
                if (component_id == "") {
                    change_state_of_controller_services(pg_id.toString());
                }
                else {
                    change_state_of_controller_services(component_id.toString());
                }
            }
            else {
                alert(`Please type ENABLE/DISABLE(Case-sensitive) correctly again to proceed forward`);
            }
        }
    }

    document.addEventListener("click", (event) => {
        if (event.target.id == "custom-disable-all-controller-services") {
            change_controller_service_state("DISABLED");
        }

    });

    console.log("Nifi Utils - addCustomUiElements: Content Script is successfully injected.");
}
catch (error) {
    console.log(error);
}