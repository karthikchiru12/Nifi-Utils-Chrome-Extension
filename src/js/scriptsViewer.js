/************************************************************************************************************/
const replacerFunction = (key, value) => {
    // This is crucial
    if (key.includes("script-body")) return `<br><br><pre><code class=groovy>${value.replaceAll(/&/g, "&amp;").replaceAll(/"/g, "&quot;").replaceAll("\t", "    ").replaceAll(/\r*\n/g, "&#10;").replaceAll(/</g, "&lt;").replaceAll(/>/g, "&gt;").replaceAll(/'/g, "&#039;")}</code></pre><br><br>`;
    return value
}
/************************************************************************************************************/
chrome.storage.local.get([`scriptsDataStore`], (item) => {
    var scriptsDataStore = item[`scriptsDataStore`];
    if (scriptsDataStore != null && scriptsDataStore != undefined) {
        let scriptsTableData = ``;
        let idx = 1;
        scriptsDataStore.data.forEach((record) => {
            scriptsTableData += `<tr><td>${idx}</td><td>${record["component"]["name"] + "<br><br>" + record["component"]["type"]}<br><br><a target="_blank" href="https://${scriptsDataStore.hostname}/nifi/?processGroupId=${record["component"]["parentGroupId"]}&componentIds=${record["id"]}" style="color:tomato;text-decoration:none;">Open Processor Location</a></td><td>${JSON.stringify(record["component"]["config"]["properties"], replacerFunction, 2)}</td></tr>`;
            idx++;
        });
        document.getElementById(`reportLevel`).innerHTML = `The report is generated at level : <a target="_blank" href="https://${scriptsDataStore.hostname}/nifi/?processGroupId=${scriptsDataStore["parentPgId"]}" style="color:tomato;text-decoration:none;">${scriptsDataStore["parentPgId"]}</a>`;
        document.getElementById(`scriptsTableLoader`).style.display = 'none';
        document.getElementById(`scriptsTable`).insertAdjacentHTML(`beforeend`, scriptsTableData);
        hljs.highlightAll();
    }
    else {
        document.getElementById(`scriptsTableLoader`).style.display = 'none';
    }
});

document.addEventListener("click", (event) => {
    if (event.target.id == `clearScriptsReport`) {
        chrome.storage.local.remove(["scriptsDataStore"], () => {
            var error = chrome.runtime.lastError;
            if (error) {
                console.error(error);
            }
        });
        document.getElementById(`scriptsTable`).innerHTML = ``;
        setTimeout(() => {
            window.close();
        },2000);
    }
});
/************************************************************************************************************/







