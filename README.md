# Villager-API
A useful, Minecraft-related and otherwise API, designed to be used by [Villager Bot](https://github.com/Villager-Dev/Villager-Bot)
* The api is currently running and accessible at `api.iapetus11.me`

## Routes / Endpoints
### **Minecraft Related Endpoints/Routes**
* `GET /mc/status/:mcserver` [Ratelimit: 1 request / 1.5 seconds]
  * Takes one **url** parameter:
    * `mcserver` (required) which is the host/ip of the server
  * Example: `GET https://api.iapetus11.me/mc/status/hypixel.net:25565`
  * Returns a JSON response

<br>

* `GET /mc/statuscard/:mcserver` [Ratelimit: 1 request / 1.5 seconds]
  * takes one **url** and one [optional] **query** parameter:
    * `mcserver` (required, url parameter) which is the host/ip of the server
    * `name` (optional, query parameter) text which will be shown instead of the server ip in the generated image
  * Example: `GET https://api.iapetus11.me/mc/statuscard/hypixel.net:25565?name=BruhCraftHD`
  * Returns an image, returns JSON if an error occurs

<br>

* `GET /mc/favicon/:mcserver` [Ratelimit: 1 request / 1.5 seconds]
  * takes one **url** parameter:
    * `mcserver` (required) which is the host/ip of the server
  * Example: `GET https://api.iapetus11.me/mc/favicon/hypixel.net:25565`
  * Returns an image, returns JSON if an error occurs

<br>

* `GET /mc/achievement/:text` [Ratelimit: 1 request / 1 second]
  * takes on **url** parameter:
    * `text` (required) which is the text which goes in the generated achievement (Must not be over 30 characters)
  * Example: `GET https://api.iapetus11.me/mc/achievement/best%20api`
  * Returns an image, returns JSON if an error occurs

<br>

* `GET /mc/splash/:text` [Ratelimit: 1 request / 1 second]
  * takes on **url** parameter:
    * `text` (required) which is the text which goes in the generated achievement (Must not be over 30 characters)
  * Example: `GET https://api.iapetus11.me/mc/splash/villager%20bot%20best%20bot`
  * Returns an image, returns JSON if an error occurs

<br>

### **Reddit Related Endpoints/Routes**
* `GET /reddit/gimme/:subreddits` [Ratelimit: 2 requests / 1 second]
  * takes one parameter **in the url**
    * `subreddits` (required) the subreddits to fetch images from
  * Example 1: `GET https://api.iapetus11.me/reddit/gimme/dankmemes`
  * Example 2: `GET https://api.iapetus11.me/reddit/gimme/dankmemes+memes+me_irl+meme`
  * Returns a JSON response
