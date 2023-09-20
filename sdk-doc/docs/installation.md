---
sidebar_position: 2
---

# Installation

To install the SDK, simply add it to your project:

```js
npm install --save @arena-im/chat-sdk
yarn add @arena-im/chat-sdk
```

### Initialize

To initialize the SDK you'll need your site slug and a chat room slug and both can be obtained from the Arena Dashboard or using the Platform API.

You can find your site slug in the dashboard settings: [https://dashboard.arena.im/settings/site](https://dashboard.arena.im/settings/site).

To access the chat room slug, go to the [chat list page](https://dashboard.arena.im/chatlist), find the chat and take the last route param as in the example below:

![Initialize Example](/img/initialize-example.png "Initialize Example")

```js
import ArenaChat from '@arena-im/chat-sdk';

//for USA region
const arenaChat = new ArenaChat({apiKey: 'my-site-slug'});

//for EU region
const arenaChat = new ArenaChat({apiKey: 'my-site-slug', region: 'EU'});
```

### Examples

You can find all examples [here](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/sdk/examples).

- [Reactjs live example](https://codesandbox.io/s/distracted-yalow-nm0d7)
- [Vuejs live example](https://codesandbox.io/s/magical-jennings-seqr5)
