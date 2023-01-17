/************************************************************************************************************/

try {
    var finalOmniDataStore = {};
    // Handling install and update events
    chrome.runtime.onInstalled.addListener(function (event) {
        if (event.reason == `install`) {
            chrome.tabs.create({
                url: `https://chiranjeevikarthik.me/Nifi-Utils/?status=installed`
            });
        }
        if (event.reason == `update`) {
            const version = chrome.runtime.getManifest()[`version`];

            // Disabling all the custom UI components on extension update

            var optionsObj = {};
            optionsObj["copy_jwt_token_component"] = "disabled";
            optionsObj["copy_link_component"] = "disabled";
            optionsObj["enable_all_controller_services_component"] = "disabled";
            optionsObj["disable_all_controller_services_component"] = "disabled";
            optionsObj["upload_to_drive_component"] = "disabled";
            optionsObj["service_info_component"] = "disabled";
            chrome.storage.local.set({ "optionsDataStore": optionsObj }, () => {
                console.log("Saved!");
            });
            chrome.tabs.create({
                url: `https://chiranjeevikarthik.me/Nifi-Utils/?status=updated&version=${version}`
            });
        }
    });

    // Handling input change in the omni search box
    chrome.omnibox.onInputChanged.addListener(
        function (text, suggest) {
            console.log(`inputChanged: ` + text);
            var searchResults = [];

            Object.entries(finalOmniDataStore).forEach((element) => {
                if (element[1].toLowerCase().includes(text.toLowerCase())) {
                    searchResults.push({ content: `https://${element[0].split(",")[1]}/nifi/?processGroupId=${element[0].split(",")[0]}`, description: `(${element[0].split(",")[1]}) ${EncodeXMLEscapeChars(element[1])}` })
                }
            });

            suggest(searchResults);
        });


    // Handling the first time input change in the omni search box
    chrome.omnibox.onInputStarted.addListener(
        function () {
            chrome.storage.local.get([`omniDataStore`], (item) => {
                var omniDataStore = item[`omniDataStore`];
                if (omniDataStore != null && omniDataStore != undefined) {
                    finalOmniDataStore = omniDataStore;
                }
            });
        }
    );

    // When one of the options is selected in the omni search box
    chrome.omnibox.onInputEntered.addListener((text) => {
        const url = text;
        console.log(url);
        chrome.tabs.update({ url });
    });

    // The below piece of code is taken from here : https://stackoverflow.com/a/32712035
    function EncodeXMLEscapeChars(str) {
        var OutPut = str;
        if (OutPut.trim() != "") {
            OutPut = str.replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
            OutPut = OutPut.replace(/&(?!(amp;)|(lt;)|(gt;)|(quot;)|(#39;)|(apos;))/g, "&amp;");
            OutPut = OutPut.replace(/([^\\])((\\\\)*)\\(?![\\/{])/g, "$1\\\\$2");  //replaces odd backslash(\\) with even.
        }
        else {
            OutPut = "";
        }
        return OutPut;
    }

    chrome.tabs.onActivated.addListener(() => { // On tab active
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            if (tabs[0].url.toString().includes(`/nifi/`)) {
                // When active tab is a nifi instance.
                chrome.action.setBadgeText({ text: `•` });
                chrome.action.setBadgeBackgroundColor({ color: `green` });
                chrome.action.setTitle({ tabId: tabs[0].id, title: `Nifi Utils\n\nFor help\nclick on the logo\ninside extension\n` });
            }
            else {
                chrome.action.setBadgeText({ text: `` });
                chrome.action.setTitle({ tabId: tabs[0].id, title: `Nifi Utils\nType\n\n"nu" + "spacebar"\n\nAnd then type\nkeyword\nto search\n\n` });
            }
        });
    });

    chrome.tabs.onUpdated.addListener(() => { // On tab updated
        chrome.tabs.query({ currentWindow: true, active: true }, function (tabs) {
            if (tabs[0].url.toString().includes(`/nifi/`)) {
                // When updated tab is a nifi instance.
                chrome.action.setBadgeText({ text: `•` });
                chrome.action.setBadgeBackgroundColor({ color: `green` });
                chrome.action.setTitle({ tabId: tabs[0].id, title: `Nifi Utils\n\nFor help\nclick on the logo\ninside extension\n` });
            }
            else {
                chrome.action.setBadgeText({ text: `` });
                chrome.action.setTitle({ tabId: tabs[0].id, title: `Nifi Utils\nType\n\n"nu" + "spacebar"\n\nAnd then type\nkeyword\nto search\n\n` });
            }
        });
    });

}
catch (error) {
    console.log(error);
}

/************************************************************************************************************/

try {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.actionName == "loadEnvironmentsContextMenu") {
                // When omni search data store is updated 
                chrome.contextMenus.removeAll(
                    // Removing all the existing extension context menus
                    () => {
                        console.log("Cleared the context menus");
                    }
                );
                chrome.storage.local.get([`environmentCountsDataStore`], (item) => {
                    var environmentCountsDataStore = item[`environmentCountsDataStore`];
                    if (environmentCountsDataStore != null && environmentCountsDataStore != undefined) {
                        // Creating a parent context menu
                        chrome.contextMenus.create({
                            title: "Open environment",
                            id: "parentMenu",
                            contexts: ["all"]
                        }, () => {
                            console.log(chrome.runtime.lastError)
                        });
                        Object.keys(environmentCountsDataStore).forEach((environment) => {
                            // Creating child context menus
                            chrome.contextMenus.create({
                                id: environment,
                                title: environment + ` : ` + environmentCountsDataStore[environment],
                                parentId: "parentMenu",
                                contexts: ["all"]
                            }, () => {
                                console.log(chrome.runtime.lastError)
                            });
                        });
                        sendResponse({ status: "success" });
                    }
                });

            }
        });
}
catch (error) {
    console.log(error);
}

try {
    // Opening corresponding nifi environment, when clicked
    chrome.contextMenus.onClicked.addListener((event) => {
        chrome.tabs.create({
            url: `https://${event.menuItemId}/nifi`
        });
    });
}
catch (error) {
    console.log(error)
}

/************************************************************************************************************/