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

## Installation

To install a SDK, simply add the high-level package, for example:

```sh
npm install --save @arena-im/chat-sdk
yarn add @arena-im/chat-sdk
```

## Usage

To use this SDK, call `ArenaChat(YOUR_SITE_SLUG)` as early as possible after loading the page. This will initialize the SDK and hook into the environment.

```javascript
import ArenaChat from '@arena-im/chat-sdk';

const arenaChat = new ArenaChat('my-site-slug');
```

To get a channel or set a user, use the exported functions of `arenaChat`.

```javascript
// create a channel with chat slug
const channel = await arenaChat.getChannel(YOUR_CHAT_SLUG);

// set current user
await arenaChat.setUser({
  id: "user-id",
  name: "Ruby Sims",
  image: "https://randomuser.me/api/portraits/women/21.jpg",
  // additional information to user
  metaData: {
    'key1': 'value1',
    'key2': 'value2'
  }
});
```

To send messages, fetch recent messages, load previous messages, or listen to channel events, use the exported functions on `channel` object.

```javascript
// receive the last 20 messages
const messages = await channel.loadRecentMessages(20);

// send message
await channel.sendMessage('Hello World!');

// receive the 5 previous messages
const previousMessages = await channel.loadPreviousMessages(5);

// watch new messages
channel.watchNewMessage((message) => {
  // if the message was added
  if (message.changeType === 'added') {
    // add message to the UI
  } else if (message.changeType === 'removed') {
    // remove message from the UI
  }
});

```

## Other Packages

Besides the high-level SDKs, this repository contains shared packages, helpers and configuration used for SDK
development. If you're using TypeScript, have a look at the resources below:

- [`@arena-im/types`](https://github.com/stationfy/arena-chat-sdk/tree/develop/packages/types): Types used in all packages.
