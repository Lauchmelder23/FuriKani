const submitButton = document.getElementById("submit-token")
const inputField = document.getElementById("token");

submitButton.addEventListener( "click", () => {
    chrome.storage.local.set({"token": inputField.value})
})

const downloadButton = document.getElementById("download")
downloadButton.addEventListener("click", async () => {
    var loadingText = document.getElementById("loading")
    loadingText.innerHTML = "Loading..."

    chrome.runtime.sendMessage("", {type: "sync"}, response => {
            if(response.success)
                loadingText.innerHTML = "Done!"
            else
                loadingText.innerHTML = response.error
        })
})

chrome.storage.local.get("level", (data) => {
    const levelSpan = document.getElementById("level")
    levelSpan.innerHTML = data.level
})
