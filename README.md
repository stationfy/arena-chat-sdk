<p align="center">
  <a href="https://arena.im" target="_blank" align="center">
    <img src="https://dashboard-sandbox.arena.im/js/imgs/arena-logo-purple.png" width="280">
  </a>
  <br />
</p>

[![npm version](https://img.shields.io/npm/v/@arena-im/chat-sdk.svg)](https://www.npmjs.com/package/@arena-im/chat-sdk)

# Official Arena Chat SDKs for JavaScript

This is the next line of Arena JavaScript SDKs, comprised in the `@arena-im/` namespace. It will provide a more
convenient interface and improved consistency between various JavaScript environments.

## Installation and Usage

To install a SDK, simply add the high-level package, for example:

```sh
npm install --save @arena-im/chat-sdk
yarn add @arena-im/chat-sdk
```

Setup and usage of these SDKs always follows the same principle.

```javascript
import ArenaChat from '@arena-im/chat-sdk';
// ...
const arenaChat = new ArenaChat(YOUR_SITE_SLUG);
const channel = await arenaChat.getChannel(YOUR_CHAT_SLUG);

const user: ExternalUser = {
  id: "user-id",
  name: "Ruby Sims",
  image: "https://randomuser.me/api/portraits/women/21.jpg",
  // additional information to user
  metaData: {
    'key1': 'value1',
    'key2': 'value2'
  }
};
await arenaChat.setUser(user);
// ...
channel.sendMessage("Hello, world!");

```

## Other Packages

Besides the high-level SDKs, this repository contains shared packages, helpers and configuration used for SDK
development. If you're using TypeScript, have a look at the resources below:

- [`@arena-im/types`](https://github.com/stationfy/arena-chat-sdk/tree/develop/packages/types): Types used in all packages.
