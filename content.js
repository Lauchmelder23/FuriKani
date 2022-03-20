// Get stored word list from chrome storage
chrome.storage.local.get(["vocabulary", "kanji", "validUserLevel"], (data) => {
    // The users level is not valid, e.g. it exceeds the maximum allowed level
    // WaniKani requires that devs check if users are actually allowed to access content of this level
    if(!data.validUserLevel)
        return

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
            if(ruby.lastElementChild.tagName.toLowerCase() === "rb")
            {
                ruby.innerHTML = ruby.lastElementChild.innerHTML
                break
            }

            ruby.removeChild(ruby.lastElementChild)
        }

        // If the contents of the <ruby> tag are in the word list, remove the <rt> tag
        if(vocabulary.includes(ruby.innerText) || kanji.includes(ruby.innerText))
        {
            var rtTag = rubyTags.item(tag).getElementsByTagName("rt").item(0)
            try 
            {
                rtTag.parentNode.removeChild(rtTag)
            } catch(error)
            {
                console.error(error)
                console.log(rubyTags.item(tag))
            }
        }
    }
})