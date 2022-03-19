chrome.storage.local.get("characters", (data) => {
    const characters = data.characters

    var rubyTags = document.body.getElementsByTagName("ruby")

    for(let tag in rubyTags)
    {
        var ruby = document.createElement("ruby")
        ruby.innerHTML = rubyTags.item(tag).innerHTML

        var dummyRtTag = ruby.getElementsByTagName("rt").item(0)
        try 
        {
            dummyRtTag.parentNode.removeChild(dummyRtTag)
        } catch(error)
        {
            console.error(error)
            console.log(ruby)
        }

        if(characters.includes(ruby.innerText))
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