# Discord Stock Bot

Given a stock symbol, returns price information

# Install

This is not currently a public bot, you need
to make your own Discord App in the developer portal,
and then pass your own bot tokens into `.env`
along with a `prefix` (I use `$`)

See the `env.default` file for the expected format.

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

# License

Apache 2

```
Copyright 2021 Peter Kenji Yamanaka

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

