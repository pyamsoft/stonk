# Discord Stock Bot

Given a stock symbol, returns price information

# Install

This is not currently a public bot, you need
to make your own Discord App in the developer portal,
and then pass your own bot tokens into `config.json`
along with a `prefix` (I use `$`)

# Running
```
$ node ./index.js
```

# Usage

In any channel the bot is present in, type `<PREFIX>`
followed by the symbols you want information about, like so:

```
 <In #general>

 me >  $ MSFT AAPL

 bot > MSFT: 216.16 (+0.70%) [+1.51]
       AAPL: 117.34 (-0.14%) [-0.17]

```
