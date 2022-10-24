try {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const status = urlParams.get("status");
    const version = urlParams.get("version");
    if (status == "installed") {
        document.getElementById("status").innerText = `Successfully Installed...!`;
    }
    if (status == "updated") {
        document.getElementById("status").innerText = `Successfully Updated To v${version}...!`;
    }
    if (status == "tutorial")
    {
        document.getElementById("status").innerText = `Please go through the tutorial below ...!`;
    }
}
catch(error)
{
    console.log(error);
}