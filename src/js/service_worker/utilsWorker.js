/************************************************************************************************************/


try {
    var finalOmniDataStore = {};

    chrome.runtime.onInstalled.addListener(function (event) {
        if (event.reason == `install`) {
            chrome.tabs.create({
                url: `src/views/about.html?status=installed`
            });
        }
        if (event.reason == `update`) { 
            const version = chrome.runtime.getManifest()[`version`];
            chrome.tabs.create({
                url: `src/views/about.html?status=updated&version=${version}`
            });
        }
    });

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
                var environmentCountsDataStore;
                chrome.contextMenus.removeAll(
                    () => {
                        console.log("Cleared the context menus");
                    }
                );
                chrome.storage.local.get([`environmentCountsDataStore`], (item) => {
                    var environmentCountsDataStore = item[`environmentCountsDataStore`];
                    if (environmentCountsDataStore != null && environmentCountsDataStore != undefined) {
                        chrome.contextMenus.create({
                            title: "Open environment",
                            id: "parentMenu",
                            contexts: ["all"]
                        }, () => {
                            console.log(chrome.runtime.lastError)
                        });
                        Object.keys(environmentCountsDataStore).forEach((environment) => {
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


chrome.contextMenus.onClicked.addListener((event) => {
    chrome.tabs.create({
        url: `https://${event.menuItemId}/nifi`
    });
});


try {

}
catch (error) {
    console.log(error)
}