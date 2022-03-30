chrome.storage.local.get("token", (data) => {
    if(data.token !== undefined)
        return

    chrome.storage.local.set({
        "enabled": true,
        "enabledVocab": true,
        "enabledKanji": true
    })
})

// Query a WaniKani API endpoint with the given token
const query = (token, url) => 
    new Promise(async (resolve, reject) => { 
        // Create header with the authorization token
        const requestHeaders = new Headers()
        requestHeaders.append("Authorization", "Bearer " + token)

        // Construct request
        const endpoint = new Request(
            url, 
            { 
                method: "GET", 
                headers: requestHeaders
            }
        )

        // Fetch the response. If it returns HTTP 200, resolve the promise,
        // otherwise reject it
        var result = await fetch(endpoint)
        if(!result.ok)
        {
            var message = await result.json()
            return reject(message.error + " (" + message.code + ")")
        }

        return resolve(result.json())
    })

// Update the local cache with new data
const updateCache = async (token, oldLevel, newLevel) => {
    // If oldLevel is undefined, then a sync has never been performed (first time user)
    if(oldLevel === undefined)
        oldLevel = 1

    // Create a list of levels that need to be synced
    // If the new level is bigger than the old level (user leveled up)
    // --> Just fetch the new level(s)
    // If the new level is smaller than the old level (user reset)
    // --> Fetch everything up until the new level
    var levelArray = []
    var startLevel = newLevel > oldLevel ? oldLevel : 1
    for(var i = startLevel; i < newLevel; i++)
        levelArray.push(i)

    // Turn the array of levels into a comma separated list
    var levelURLString = levelArray.join(",")

    // Data buffers
    var vocabulary = new Set();
    var kanji = new Set();

    // If the old level is less than the new level add the old data to the new data
    if(oldLevel < newLevel)
    {
        await chrome.storage.local.get(["vocabulary", "kanji"], (data) => {
            if(data.vocabulary !== undefined && data.kanji !== undefined)
            {
                data.vocabulary.forEach(vocabulary.add, vocabulary)
                data.kanji.forEach(kanji.add, kanji)
            }
        })
    }

    // API endpoint
    var url = "https://api.wanikani.com/v2/subjects?types=vocabulary&levels=" + levelURLString
    
    // WaniKani only sends 1000 elements in one response and then provides us with a link to the
    // next "page" of the data. We need to loop until the next page is null
    do
    {
        // Query API, extract all the important info and then update the URL to the next page
        var response = await query(token, url).catch(reason => console.error("WaniKani API request failed: " + reason))
        if(response === undefined)
            break
            
        for(let i in response.data)
            vocabulary.add(response.data[i].data.characters)

        url = response.pages.next_url
    } while(url !== null)

    // Extract Kanji as well
    var url = "https://api.wanikani.com/v2/subjects?types=kanji&levels=" + levelURLString
    var kanji = new Set()
    
    do
    {
        var response = await query(token, url).catch(reason => console.error("WaniKani API request failed: " + reason))
        if(response === undefined)
            break
            
        for(let i in response.data)
            kanji.add(response.data[i].data.characters)

        url = response.pages.next_url
    } while(url !== null)
    
    // Cache the data
    chrome.storage.local.set({
        "vocabulary": [...vocabulary],
        "kanji": [...kanji],
        "level": newLevel
    })
}

// Synchronizes local data with wanikanis data
const sync = () => 
    new Promise((resolve, reject) => {
        chrome.storage.local.get(["level", "token"], async (data) => {
            // See if wanikani token is well formed
            const apiTokenPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/
            if(!apiTokenPattern.test(data.token))
                return reject("Please set a valid WaniKani API Token")

            // Get user info
            var user = await query(data.token, "https://api.wanikani.com/v2/user").catch(reason => reject(reason))
            if(user === undefined)
                return
            
            // Get user level
            level = user.data.level

            // if users level is larger than max allowed level, abort
            if(level > user.data.subscription.max_level_granted)
            {
                chrome.storage.local.set({"validUserLevel": false})
                return reject("User account level exceeds account level limit")
            }

            // If the wanikani level differs from the local level, update the cache
            if(level !== data.level)
                await updateCache(data.token, data.level, level)

            chrome.storage.local.set({"validUserLevel": true})
            resolve("Successfully synchronized data!")
        })
    })

// Message listener for the Sync button
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

// At browser start, sync with wanikani
chrome.runtime.onStartup.addListener(() => {
    sync().then(value => console.log(value)).catch(reason => {})
})