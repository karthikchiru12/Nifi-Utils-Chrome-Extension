function authenticate() { // Method to identify google account login and fetch the oAuth 2.0 token
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        // caching the account login status
        chrome.storage.local.set({ "loggedIn": "true" }, () => {
            console.log("Saved!");
        });
        // caching the account oAuth token
        chrome.storage.local.set({ "oAuthToken": token }, () => {
            console.log("Saved!");
            window.location.reload();
        });
    });
    
};

document.getElementById(`signInWithGoogle`).addEventListener(`click`, (event) => { // Whenever sign in button is pressed.
    authenticate();
});

chrome.storage.local.get([`loggedIn`], (item) => { 
    // Get the login status
    var loggedIn = item[`loggedIn`];
    if (loggedIn != null && loggedIn != undefined) {
        if (loggedIn == "true") { 
            // If user is logged in
            chrome.identity.getProfileUserInfo(
                { accountStatus: 'ANY' }, // if this object is not passed, getProfileUserInfo() gives data only when sync is enabled in browser.
                (details) => {
                    if (details.id != "" && details.email != "") { 
                        // Updating the UI with signed in email.
                        document.getElementById(`accountDetails`).innerHTML = `Sign in successful. You are signed in as <b>${details.email}</b>`;
                    }
                }
            );
        }
        else {
            // If user is not logged in show the sign in with goggle button
            document.getElementById(`signInWithGoogle`).style.display = "inline";
        }
    }
    else {
        // Show sign in button when the extension is first installed and upload to drive component is enabled.
        document.getElementById(`signInWithGoogle`).style.display = "inline";
    }
});