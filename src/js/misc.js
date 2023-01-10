/************************************************************************************************************/
try {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const status = urlParams.get(`status`);
    const version = urlParams.get(`version`);
    if (status == `installed`) {
        // When extension is installed
        document.getElementById(`status`).innerText = `Successfully Installed...!`;
    }
    if (status == `updated`) {
        // When extension is updated
        document.getElementById(`status`).innerText = `Successfully Updated To v${version}...!`;
    }
    if (status == `tutorial`) {
        // When extension`s icon is clicked inside the popup
        document.getElementById(`status`).innerText = `Please go through the tutorial below ...!`;
    }
}
catch (error) {
    console.log(error);
}
/************************************************************************************************************/