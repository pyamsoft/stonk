# Discord Stock Bot

Given a stock symbol, returns price information

# Install

This is not currently a public bot, you need
to make your own Discord App in the developer portal,
and then pass your own bot tokens into `.env`
along with a `prefix` (I use `$`)

Copy the `env.default` file to `.env` to get started!

# Running

You will need to create a Bot in the 
[Discord Developer Portal](https://discord.com/developers/applications/). At
a minimum, the bot must have a `TOKEN` and you must set the bot up with the
`Message Content` intent.

[![Intents](https://raw.githubusercontent.com/pyamsoft/stonk/main/art/intents.png)][1]

```bash
$ yarn && yarn start

OR 

$ ./bin/dockerize
```

# Usage

In any channel the bot is present in, type `<PREFIX>`
followed by the symbols you want information about:

[![Example Bot Command](https://raw.githubusercontent.com/pyamsoft/stonk/main/art/ticker.png)][2]

You can also lookup the ticker of a company via a lookup. Type `<PREFIX><PREFIX>`
followed by the search term (like the company name):

[![Example Lookup Command](https://raw.githubusercontent.com/pyamsoft/stonk/main/art/lookup.png)][3]

You can receive similar recommendations related to a ticker. Type `<PREFIX><PREFIX><PREFIX>`
followed by the symbol you want related recommendations for:

[![Example Recommend Command](https://raw.githubusercontent.com/pyamsoft/stonk/main/art/recs.png)][4]

For additional help and options, type the `<PREFIX>` and the bot will display all of its commands.

## Customization

You can have the bot only watch and reply in a designated channels by providing the
`BOT_TARGET_CHANNEL_IDS` variable in the `.env` file, otherwise the bot will watch and reply from
all channels. The `BOT_TARGET_CHANNEL_IDS` is a comma-seperated list of channel IDs.

The bot will always watch and reply in individual DMs.

# License

Apache 2

```
Copyright 2023 pyamsoft

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```


[1]: https://raw.githubusercontent.com/pyamsoft/stonk/main/art/intents.png
[2]: https://raw.githubusercontent.com/pyamsoft/stonk/main/art/ticker.png
[3]: https://raw.githubusercontent.com/pyamsoft/stonk/main/art/lookup.png
[4]: https://raw.githubusercontent.com/pyamsoft/stonk/main/art/recs.png
