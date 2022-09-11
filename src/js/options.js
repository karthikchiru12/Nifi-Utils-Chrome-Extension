chrome.storage.local.get(["options_data_store"], (item) => {
    var itemValue = item["options_data_store"];
    if (itemValue != null && itemValue != undefined) {
        Object.keys(itemValue).forEach((element) => {
            if (itemValue[element] == "enabled") {
                document.getElementsByName(element)[0].checked = "true";
            }
            else {
                document.getElementsByName(element)[1].checked = "true";
            }
        });
    }
    else {
        var options_obj = {};
        options_obj["copy_jwt_token_component"] = "disabled";
        options_obj["copy_link_component"] = "disabled";
        options_obj["enable_all_controller_services_component"] = "disabled";
        options_obj["disable_all_controller_services_component"] = "disabled";
        chrome.storage.local.set({ "options_data_store": options_obj }, () => {
            console.log("Saved!");
        });
        window.location.reload();
    }
});

document.getElementById("saveCurrentOptions").addEventListener("click", (event) => {
    chrome.storage.local.get(["options_data_store"], (item) => {
        var itemValue = item["options_data_store"];
        if (itemValue != null && itemValue != undefined) {
            Object.keys(itemValue).forEach((element) => {
                if (document.getElementsByName(element)[0].checked) {
                    itemValue[element] = "enabled";
                    console.log(document.getElementsByName(element)[0].checked);
                }
                else {
                    itemValue[element] = "disabled";
                }
            });
            chrome.storage.local.set({ "options_data_store": itemValue }, () => {
                console.log("Saved!");
            });
            console.log(itemValue);
            alert("Options saved!...");
        }
    });


});