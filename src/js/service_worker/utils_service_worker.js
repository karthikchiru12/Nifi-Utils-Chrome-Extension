chrome.runtime.onInstalled.addListener(function (event) {
    if (event.reason == "install") {
        chrome.tabs.create({
            url: "src/views/about.html"
        });
    }
});