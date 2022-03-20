const submitButton = document.getElementById("submit-token")
const inputField = document.getElementById("token")
const statusField = document.getElementById("token-status")
const errorField = document.getElementById("error-text")

const globalSetting = document.getElementById("setting-global")
const vocabSetting = document.getElementById("setting-vocabulary")
const kanjiSetting = document.getElementById("setting-kanji")

// Set popup content
chrome.storage.local.get(["level", "token", "enabled", "enabledVocab", "enabledKanji"], (data) => {
    if(data.token === undefined)
    {
        statusField.innerHTML = String.fromCodePoint(0x2757)
        submitButton.innerHTML = String.fromCodePoint(0x2705)
        submitButton.classList.add("no-token")
    }
    else
    {
        statusField.innerHTML = String.fromCodePoint(0x2705)
        submitButton.innerHTML = String.fromCodePoint(0x1F501)
    }

    const levelSpan = document.getElementById("level")
    levelSpan.innerHTML = data.level

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

    globalSetting.checked = data.enabled
    vocabSetting.checked = data.enabledVocab
    kanjiSetting.checked = data.enabledKanji
})

// Set the wanikani token
submitButton.addEventListener( "click", () => {
    if(submitButton.classList.contains("new-token"))
    {
        chrome.storage.local.set({"token": inputField.value})
        submitButton.classList.remove("new-token", "no-token")
        inputField.value = ""
    }

    if(submitButton.classList.contains("no-token"))
        return

    statusField.innerHTML = String.fromCodePoint(0x23F1)

    chrome.runtime.sendMessage("", {type: "sync"}, response => {
            if(response.success)
            {
                statusField.innerHTML = String.fromCodePoint(0x2705)
                errorField.innerHTML = ""
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

    if(!globalSetting.checked)
    {
        vocabSetting.checked = false
        kanjiSetting.checked = false

        vocabSetting.setAttribute("disabled", true)
        kanjiSetting.setAttribute("disabled", true)
    }
    else
    {
        chrome.storage.local.get(["enabledVocab", "enabledKanji"], (data) => {
            vocabSetting.checked = data.enabledVocab
            kanjiSetting.checked = data.enabledKanji
        })

        vocabSetting.removeAttribute("disabled")
        kanjiSetting.removeAttribute("disabled")
    }

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