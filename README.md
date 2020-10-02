# Villager-API
A Minecraft (and other things) related API, designed to be used by [Villager Bot](https://github.com/Villager-Dev/Villager-Bot)

## Routes / Endpoints
#### `betterapi.net/mc/` Endpoints
* `GET /mc/mcping?host=host&port=port`
  * takes two **query** parameters:
    * `host` (required) which is the host/ip of the server
    * `port` (optional) the port of the server
* `GET /mc/mcpingimg?host=host&port=port&imgonly=boolean&customname=customname`
  * takes four **query** parameters:
    * `host` (required) which is the host/ip of the server
    * `port` (optional) the port of the server
    * `imgonly` (optional, default: false) whether to send just the image or the image and associated information
    * `customname` (optional) text which will be shown instead of the server ip in the generated image
* `GET /mc/serverfavi?host=host&port=port`
  * takes two **query** parameters:
    * `host` (required) which is the host/ip of the server
    * `port` (optional) the port of the server

#### `betterapi.net/reddit/` Endpoints
* `GET /reddit/gimme/:subreddits`
  * takes one parameter **in the url**
    * `:subreddits` (required) the subreddits to fetch images from
      * can either be one subreddit (`GET betterapi.net/reddit/gimme/dankmemes`) or multiple (`GET betterapi.net/reddit/gimme/dankmemes+memes+me_irl+meme`)
