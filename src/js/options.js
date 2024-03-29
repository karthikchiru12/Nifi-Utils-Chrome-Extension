/************************************************************************************************************/

chrome.storage.local.get(["optionsDataStore"], (item) => {
    var optionsDataStore = item["optionsDataStore"];
    if (optionsDataStore != null && optionsDataStore != undefined) {
        // Updates the UI with current options
        Object.keys(optionsDataStore).forEach((element) => {
            try {
                if (optionsDataStore[element] == "enabled") {
                    document.getElementsByName(element)[0].checked = "true";
                }
                else {
                    document.getElementsByName(element)[1].checked = "true";
                }
            }
            catch (error) {
                console.log(error);
            }
            document.getElementById("live_jvm_metrics_refresh_interval").value = optionsDataStore["live_jvm_metrics_refresh_interval"];
            document.getElementById("refresh_interval_value").innerHTML = `${optionsDataStore["live_jvm_metrics_refresh_interval"]} seconds`;
        });
    }
    else {
        // Initialize the options when extension is installed. (All are disabled by default)
        var optionsObj = {};
        optionsObj["copy_jwt_token_component"] = "disabled";
        optionsObj["copy_link_component"] = "disabled";
        optionsObj["enable_all_controller_services_component"] = "disabled";
        optionsObj["disable_all_controller_services_component"] = "disabled";
        optionsObj["upload_to_drive_component"] = "disabled";
        optionsObj["service_info_component"] = "disabled";
        optionsObj["copy_flow_component"] = "disabled";
        optionsObj["live_jvm_metrics_component"] = "disabled";
        optionsObj["discover_scripts_component"] = "disabled";
        optionsObj["live_jvm_metrics_refresh_interval"] = 5;
        chrome.storage.local.set({ "optionsDataStore": optionsObj }, () => {
            console.log("Saved!");
        });
        window.location.reload();
    }
});

/************************************************************************************************************/

document.getElementById("saveCurrentOptions").addEventListener("click", (event) => {
    chrome.storage.local.get(["optionsDataStore"], (item) => {
        var optionsDataStore = item["optionsDataStore"];
        if (optionsDataStore != null && optionsDataStore != undefined) {
            Object.keys(optionsDataStore).forEach((element) => {
                try {
                    if (document.getElementsByName(element)[0].checked) {
                        optionsDataStore[element] = "enabled";
                        console.log(document.getElementsByName(element)[0].checked);
                    }
                    else {
                        optionsDataStore[element] = "disabled";
                    }
                }
                catch (error) {
                    console.log(error);
                }
            });
            optionsDataStore["live_jvm_metrics_refresh_interval"] = document.getElementById("live_jvm_metrics_refresh_interval").value;
            chrome.storage.local.set({ "optionsDataStore": optionsDataStore }, () => {
                console.log("Saved!");
            });
            console.log(optionsDataStore);
            alert("Options saved! Please reload Nifi page for changes to take effect!...");
        }
    });
});

/************************************************************************************************************/

document.getElementById("live_jvm_metrics_refresh_interval").addEventListener("input", (event) => {
    var refreshInterval = document.getElementById("live_jvm_metrics_refresh_interval").value;
    document.getElementById("refresh_interval_value").innerHTML = `${refreshInterval} seconds`;
});

/************************************************************************************************************/

document.addEventListener("click", (event) => {
    if (event.target.id == `flush_copy_paste_cache`) {
        chrome.storage.local.remove(["dataFlowStore"], () => {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
        });
        alert("Flushed the cache!...");
    }

});

/************************************************************************************************************/