/************************************************************************************************************/

try {
    chrome.runtime.onMessage.addListener(
        function (request, sender, sendResponse) {
            if (request.actionName == "getJwtToken") {
                sendResponse({ data: localStorage.getItem("jwt"), actionName: "jwtToken" });
            }
        });
    console.log("Nifi Utils - getJwtToken: Content Script is successfully injected.");
}
catch (error) {
    console.log(error);
}

/************************************************************************************************************/