<p align="center">
  <a href="https://arena.im" target="_blank" align="center">
    <img src="https://dashboard-sandbox.arena.im/js/imgs/arena-logo-purple.png" width="280">
  </a>
  <br />
</p>

[![npm version](https://img.shields.io/npm/v/@arena-im/chat-sdk.svg)](https://www.npmjs.com/package/@arena-im/chat-sdk)

# Official Arena Chat SDK for JavaScript

Arena provides a ready-to-use live group chat widget that doesn't require any development effort and it can power many of the common scenarios. For more complex use-cases we made available the Javascript SDK that provides the infra-structure necessary to build your own chat experience and at the same time leverage the powerful moderation and backoffice tools available at the [Arena Dashboard](https://dashboard.arena.im).

The SDKs are organized inside the `@arena-im/` namespace. It can be used conveniently integrated with any Javascript framework and environment.

## Installation and Usage

To install the SDK, simply add it to your project:

```sh
npm install --save @arena-im/chat-sdk
yarn add @arena-im/chat-sdk
```

To initialize the SDK you'll need your site slug and a chat room slug and both can be obtained from the Arena Dashboard or using the Platform API.

```javascript
import ArenaChat from '@arena-im/chat-sdk';
// ...
const arenaChat = new ArenaChat(YOUR_SITE_SLUG);
const channel = await arenaChat.getChannel(YOUR_CHAT_SLUG);

const user: ExternalUser = {
  // ID of the user on your authentication system
  id: "user-id",
  name: "Ruby Sims",
  image: "https://randomuser.me/api/portraits/women/21.jpg",
  // User metadata attached to the user object
  // metaData: {
  //   'key1': 'value1',
  //   'key2': 'value2'
  // }
};
await arenaChat.setUser(user);
// ...
channel.sendMessage("Hello, world!");

```

## Other Packages

Besides the high-level SDKs, this repository contains shared packages, helpers and configuration used for SDK
development. If you're using TypeScript, take a look at the resources below:

- [`@arena-im/types`](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types): Types used in all packages.
