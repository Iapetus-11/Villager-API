# Villager-API
A useful, Minecraft-related and otherwise API, designed to be used by [Villager Bot](https://github.com/Villager-Dev/Villager-Bot)
* The api is currently running and accessible at `betterapi.net`

## Routes / Endpoints
### **Minecraft Related Endpoints/Routes**
* [Ratelimit: 2 requests / 2.5 seconds] (Applies to all endpoints under /mc/)
* `GET /mc/mcstatus/:mcserver`
  * Takes one **url** parameter:
    * `mcserver` (required) which is the host/ip of the server
  * Example: `GET https://betterapi.net/serverfavi/hypixel.net:25565`
  * Returns a JSON response

<br>

* `GET /mc/servercard/:mcserver`
  * takes one **url** and one [optional] **query** parameter:
    * `mcserver` (required, url parameter) which is the host/ip of the server
    * `customname` (optional, query parameter) text which will be shown instead of the server ip in the generated image
  * Example: `GET https://betterapi.net/servercard/hypixel.net:25565?customname=BruhCraftHD`
  * Returns an image, returns JSON if an error occurs

<br>

* `GET /mc/serverfavi/:mcserver`
  * takes one **url** parameter:
    * `mcserver` (required) which is the host/ip of the server
  * Example: `GET https://betterapi.net/serverfavi/hypixel.net:25565`
  * Returns an image, returns JSON if an error occurs

<br>

### **Reddit Related Endpoints/Routes**
* [Ratelimit: 2 requests / 2.5 seconds] (Applies to all endpoints under /reddit/)
* `GET /reddit/gimme/:subreddits`
  * takes one parameter **in the url**
    * `subreddits` (required) the subreddits to fetch images from
  * Example 1: `GET betterapi.net/reddit/gimme/dankmemes`
  * Example 2: `GET betterapi.net/reddit/gimme/dankmemes+memes+me_irl+meme`
  * Returns a JSON response
