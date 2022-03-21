// Vocab Furigana CSS
var vocabStyle = `
    .furikani-vocabulary {
        display: none;
    }
`

// Kanji Furigana CSS
var kanjiStyle  = `
    .furikani-kanji {
        display: none;
    }
`

// Create stylesheet elements on the website for the classes
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

    // If global setting is enabled, set the stylesheets depending on the other settings
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

        // Remove all tags (except for <rb>, <span>)
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

        // If the contents of the <ruby> tag are in the word list, tag the <rt> tag
        // with the correct class
        var rtTag = rubyTags.item(tag).getElementsByTagName("rt").item(0)
        if(vocabulary.includes(ruby.innerText))
            rtTag.classList.add("furikani-vocabulary")
        if(kanji.includes(ruby.innerText))
            rtTag.classList.add("furikani-kanji")
    }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    // One of the switches was checked/unchecked
    if(msg.action === "settingsUpdated")
    {
        // Retrieve current switch states
        chrome.storage.local.get(["enabled", "enabledVocab", "enabledKanji"], (data) => {  
            console.log(data)
            
            // If everything is disabled, disable all stylsheets
            if(!data.enabled)
            {
                vocabStyleSheet.innerHTML = ""
                kanjiStyleSheet.innerHTML = ""

                return
            }

            // Otherwise set the kanji and vocab stylesheets depending on their settings
            vocabStyleSheet.innerHTML = data.enabledVocab ? vocabStyle : ""
            kanjiStyleSheet.innerHTML = data.enabledKanji ? kanjiStyle : ""

            sendResponse(true)
        })
    }

    return true;
})