const query = (token, url) => 
    new Promise(async (resolve, reject) => { 
        const requestHeaders = new Headers()
        requestHeaders.append("Authorization", "Bearer " + token)

        const endpoint = new Request(
            url, 
            { 
                method: "GET", 
                headers: requestHeaders
            }
        )

        var result = await fetch(endpoint)
        if(!result.ok)
        {
            var message = await result.json()
            return reject(message.error + " (" + message.code + ")")
        }

        return resolve(result.json())
    })

const updateCache = async (token, oldLevel, newLevel) => {
    if(oldLevel === undefined)
        oldLevel = 1

    var levelArray = []
    for(var i = oldLevel; i < newLevel; i++)
        levelArray.push(i)

    var levelURLString = levelArray.join(",")

    var url = "https://api.wanikani.com/v2/subjects?types=vocabulary&levels=" + levelURLString
    var vocabulary = []

    do
    {
        var response = await query(token, url).catch(reason => console.error("WaniKani API request failed: " + reason))
        if(response === undefined)
            break

        for(let i in response.data)
            vocabulary.push(response.data[i].data.characters)

        url = response.pages.next_url
    } while(url !== null)

    var url = "https://api.wanikani.com/v2/subjects?types=kanji&levels=" + levelURLString
    var kanji = []

    do
    {
        var response = await query(token, url).catch(reason => console.error("WaniKani API request failed: " + reason))
        if(response === undefined)
            break
            
        for(let i in response.data)
            kanji.push(response.data[i].data.characters)

        url = response.pages.next_url
    } while(url !== null)

    if(oldLevel < newLevel)
    {
        await chrome.storage.local.get(["vocabulary", "kanji"], (data) => {
            vocabulary.concat(data.vocabulary)
            kanji.concat(data.kanji)
        })
    }
    
    chrome.storage.local.set({
        "vocabulary": vocabulary,
        "kanji": kanji
    })

    chrome.storage.local.set({"level": newLevel});
}

const sync = () => 
    new Promise((resolve, reject) => {
        chrome.storage.local.get(["level", "token"], async (data) => {
            const apiTokenPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
            if(!apiTokenPattern.test(data.token))
                return reject("Please set a valid WaniKani API Token")

            var user = await query(data.token, "https://api.wanikani.com/v2/user").catch(reason => reject("WaniKani API request failed: " + reason))

            if(user === undefined)
                return
            
            level = user.data.level

            chrome.storage.local.set({"validUserLevel": level <= user.data.subscription.max_level_granted})

            if(level > user.data.subscription.max_level_granted)
                return reject("User account level exceeds account level limit")

            if(level !== data.level)
                updateCache(data.token, data.level, level)

            resolve("Successfully synchronized data!")
        })
    })

chrome.runtime.onMessage.addListener((data, sender, sendResponse) => {
    if(data.type === "sync")
        sync()
            .then(value => {
                sendResponse({success: true})
            })
            .catch(reason => {
                sendResponse({success: false, error: reason})
            })

    return true;
})

sync().then(value => console.log(value)).catch(reason => console.error(reason))