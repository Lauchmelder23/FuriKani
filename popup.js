const getStorageData = key =>
  new Promise((resolve, reject) =>
    chrome.storage.local.get(key, result =>
      chrome.runtime.lastError
        ? reject(Error(chrome.runtime.lastError.message))
        : resolve(result)
    )
  )

const query = async (token, url) => { 
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
    return result.json()
    }

const submitButton = document.getElementById("submit-token");
const inputField = document.getElementById("token");

submitButton.addEventListener( "click", () => {
    chrome.storage.local.set({"token": inputField.value})
})

const downloadButton = document.getElementById("download");
downloadButton.addEventListener("click", async () => {
    const userData = await getStorageData("token")
    var url = "https://api.wanikani.com/v2/user"
    var response = await query(userData.token, url)
    var level = response.data.level
    var levelArray = []
    for(var i = 1; i < level; i++)
        levelArray.push(i)

    var levelURLString = levelArray.join(",")

    var url = "https://api.wanikani.com/v2/subjects?types=vocabulary&levels=" + levelURLString
    var vocabulary = []

    do
    {
        var response = await query(userData.token, url)
        for(let i in response.data)
            vocabulary.push(response.data[i].data.characters)

        url = response.pages.next_url
    } while(url !== null)

    var url = "https://api.wanikani.com/v2/subjects?types=kanji&levels=" + levelURLString
    var kanji = []

    do
    {
        var response = await query(userData.token, url)
        for(let i in response.data)
        kanji.push(response.data[i].data.characters)

        url = response.pages.next_url
    } while(url !== null)

    chrome.storage.local.set({
        "vocabulary": vocabulary,
        "kanji": kanji
    })
    console.log("Downloaded data!")
})