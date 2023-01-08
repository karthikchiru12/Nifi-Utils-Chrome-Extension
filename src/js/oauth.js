function authenticate() {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
        chrome.storage.local.set({ "loggedIn": "true" }, () => {
            console.log("Saved!");
        });
        chrome.storage.local.set({ "oAuthToken": token }, () => {
            console.log("Saved!");
            window.location.reload();
        });
    });
    
};



document.getElementById(`signInWithGoogle`).addEventListener(`click`, (event) => {
    authenticate();
});


chrome.storage.local.get([`loggedIn`], (item) => {
    var loggedIn = item[`loggedIn`];
    if (loggedIn != null && loggedIn != undefined) {
        if (loggedIn == "true") {
            chrome.identity.getProfileUserInfo(
                { accountStatus: 'ANY' },
                (details) => {
                    console.log(details);
                    if (details.id != "" && details.email != "") {
                        console.log(details);
                        document.getElementById(`accountDetails`).innerHTML = `Sign in successful. You are signed in as <b>${details.email}</b>`;
                    }
                }
            );

        }
        else {
            document.getElementById(`signInWithGoogle`).style.display = "inline";
        }
    }
    else {
        document.getElementById(`signInWithGoogle`).style.display = "inline";
    }
});