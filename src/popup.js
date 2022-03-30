const submitButton = document.getElementById("submit-token")
const inputField = document.getElementById("token")
const statusField = document.getElementById("token-status")
const errorField = document.getElementById("error-text")

const globalSetting = document.getElementById("setting-global")
const vocabSetting = document.getElementById("setting-vocabulary")
const kanjiSetting = document.getElementById("setting-kanji")

// Set popup content
chrome.storage.local.get(["level", "token", "enabled", "enabledVocab", "enabledKanji"], (data) => {
    // If no token is set, display exlamation mark and checkmark button
    if(data.token === undefined)
    {
        statusField.innerHTML = String.fromCodePoint(0x2757)
        submitButton.innerHTML = String.fromCodePoint(0x2705)
        submitButton.classList.add("no-token")
    }
    else    // else display checkmark and reload button
    {
        statusField.innerHTML = String.fromCodePoint(0x2705)
        submitButton.innerHTML = String.fromCodePoint(0x1F501)
    }

    // Display the users current WaniKani level
    const levelSpan = document.getElementById("level")
    levelSpan.innerHTML = data.level

    // If the input field contains text that is not the current token, turn the
    // button into a checkmark (else turn it into a repeat button)
    inputField.addEventListener("input", () => {
        if(inputField.value !== "" && inputField.value !== data.token)
        {
            submitButton.innerHTML = String.fromCodePoint(0x2705)
            submitButton.classList.add("new-token")
        }
        else 
        {
            submitButton.innerHTML = String.fromCodePoint(0x1F501)
            submitButton.classList.remove("new-token")
        }
    })

    // Set the switches to thecached values
    globalSetting.checked = data.enabled
    vocabSetting.checked = data.enabledVocab
    kanjiSetting.checked = data.enabledKanji
})

// Submit button pressed
submitButton.addEventListener( "click", () => {
    // If the submit field has a new token, replace the current one with it
    if(submitButton.classList.contains("new-token"))
    {
        chrome.storage.local.set({"token": inputField.value})
        submitButton.classList.remove("new-token", "no-token")
        inputField.value = ""
    }

    if(submitButton.classList.contains("no-token"))
        return

    statusField.innerHTML = String.fromCodePoint(0x23F1)

    // Sync with wanikani
    chrome.runtime.sendMessage("", {type: "sync"}, response => {
        if(response.success)
        {
            statusField.innerHTML = String.fromCodePoint(0x2705)
            errorField.innerHTML = ""

            // Update the users current WaniKani level
            chrome.storage.local.get("level", (data) => {
                const levelSpan = document.getElementById("level")
                levelSpan.innerHTML = data.level
            })
        }
        else
        {
            statusField.innerHTML = String.fromCodePoint(0x2757)
            errorField.innerHTML = response.error
        }
    })
})

// Set settings event listeners
globalSetting.addEventListener("change", () => {
    chrome.storage.local.set({"enabled": globalSetting.checked})

    // If the global settings are unchecked, uncheck the other options as well   
    // and disable them
    if(!globalSetting.checked)
    {
        vocabSetting.checked = false
        kanjiSetting.checked = false

        vocabSetting.setAttribute("disabled", true)
        kanjiSetting.setAttribute("disabled", true)
    }
    // Else restore the values of the switches and activate them agin
    else   
    {
        chrome.storage.local.get(["enabledVocab", "enabledKanji"], (data) => {
            vocabSetting.checked = data.enabledVocab
            kanjiSetting.checked = data.enabledKanji
        })

        vocabSetting.removeAttribute("disabled")
        kanjiSetting.removeAttribute("disabled")
    }

    // Send a message to content script that the switches were updated
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "settingsUpdated"}, (r) => {})
    })
    
})

vocabSetting.addEventListener("change", () => {
    chrome.storage.local.set({"enabledVocab": vocabSetting.checked})
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "settingsUpdated"}, (r) => {})
    })
})

kanjiSetting.addEventListener("change", () => {
    chrome.storage.local.set({"enabledKanji": kanjiSetting.checked})
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, {action: "settingsUpdated"}, (r) => {})
    })
})