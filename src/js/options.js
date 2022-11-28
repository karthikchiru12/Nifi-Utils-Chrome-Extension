/************************************************************************************************************/

chrome.storage.local.get(["optionsDataStore"], (item) => {
    var optionsDataStore = item["optionsDataStore"];
    if (optionsDataStore != null && optionsDataStore != undefined) { // Updates the UI with current options
        Object.keys(optionsDataStore).forEach((element) => {
            if (optionsDataStore[element] == "enabled") {
                document.getElementsByName(element)[0].checked = "true";
            }
            else {
                document.getElementsByName(element)[1].checked = "true";
            }
        });
    }
    else { // Initialize the optionsDataStore for the first time
        var optionsObj = {};
        optionsObj["copy_jwt_token_component"] = "disabled";
        optionsObj["copy_link_component"] = "disabled";
        optionsObj["enable_all_controller_services_component"] = "disabled";
        optionsObj["disable_all_controller_services_component"] = "disabled";
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
                if (document.getElementsByName(element)[0].checked) {
                    optionsDataStore[element] = "enabled";
                    console.log(document.getElementsByName(element)[0].checked);
                }
                else {
                    optionsDataStore[element] = "disabled";
                }
            });
            chrome.storage.local.set({ "optionsDataStore": optionsDataStore }, () => {
                console.log("Saved!");
            });
            console.log(optionsDataStore);
            alert("Options saved!...");
        }
    });


});

/************************************************************************************************************/