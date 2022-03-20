var vocabStyle = `
    .furikani-vocabulary {
        display: none;
    }
`

var kanjiStyle  = `
    .furikani-kanji {
        display: none;
    }
`

var vocabStyleSheet = document.createElement("style")
var kanjiStyleSheet = document.createElement("style")

document.head.appendChild(vocabStyleSheet)
document.head.appendChild(kanjiStyleSheet)

// Get stored word list from chrome storage
chrome.storage.local.get(["vocabulary", "kanji", "validUserLevel", "enabled", "enabledVocab", "enabledKanji"], (data) => {    
    // The users level is not valid, e.g. it exceeds the maximum allowed level
    // WaniKani requires that devs check if users are actually allowed to access content of this level
    if(!data.validUserLevel)
        return

    if(data.enabled)
    {
        if(data.enabledVocab)
            vocabStyleSheet.innerHTML = vocabStyle
        
        if(data.enabledKanji)
            kanjiStyleSheet.innerHTML = kanjiStyle
    }

    const vocabulary = data.vocabulary
    const kanji = data.kanji

    // Fetch all <ruby> tags on the website
    var rubyTags = document.body.getElementsByTagName("ruby")

    for(let tag in rubyTags)
    {
        // Copy the ruby element into a new ruby element so we can modify it
        // without modifying the website
        var ruby = document.createElement("ruby")
        ruby.innerHTML = rubyTags.item(tag).innerHTML

        // Remove all tags (except for <rb>)
        while(ruby.lastElementChild)
        {
            if(ruby.lastElementChild.tagName.toLowerCase() === "rb" ||
                ruby.lastElementChild.tagName.toLowerCase() === "span")
            {
                ruby.innerHTML = ruby.lastElementChild.innerHTML
                break
            }

            ruby.removeChild(ruby.lastElementChild)
        }

        // If the contents of the <ruby> tag are in the word list, remove the <rt> tag
        var rtTag = rubyTags.item(tag).getElementsByTagName("rt").item(0)
        if(vocabulary.includes(ruby.innerText))
            rtTag.classList.add("furikani-vocabulary")
        else if(kanji.includes(ruby.innerText))
            rtTag.classList.add("furikani-kanji")
    }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if(msg.action === "settingsUpdated")
    {
        chrome.storage.local.get(["enabled", "enabledVocab", "enabledKanji"], (data) => {  
            console.log(data)

            if(!data.enabled)
            {
                vocabStyleSheet.innerHTML = ""
                kanjiStyleSheet.innerHTML = ""

                return
            }

            vocabStyleSheet.innerHTML = data.enabledVocab ? vocabStyle : ""
            kanjiStyleSheet.innerHTML = data.enabledKanji ? kanjiStyle : ""

            sendResponse(true)
        })
    }

    return true;
})