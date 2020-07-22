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

## Installation

To install the SDK, simply add it to your project:

```sh
npm install --save @arena-im/chat-sdk
yarn add @arena-im/chat-sdk
```

## Usage

### Initialize

To initialize the SDK you'll need your site slug and a chat room slug and both can be obtained from the Arena Dashboard or using the Platform API.

```javascript
import ArenaChat from '@arena-im/chat-sdk';

const arenaChat = new ArenaChat('my-site-slug');
```

### Get Channel

To get a channel, use the exported functions of `arenaChat`.

```javascript
// get a channel with chat slug
const channel = await arenaChat.getChannel(YOUR_CHAT_SLUG);
```

### Set User

To set a user, use the exported functions of `arenaChat`

```javascript
// set current user
await arenaChat.setUser({
  // ID of the user on your authentication system
  id: "user-id",
  name: "Ruby Sims",
  image: "https://randomuser.me/api/portraits/women/21.jpg",
  // User metadata attached to the user object
  metaData: {
    'key1': 'value1',
    'key2': 'value2'
  }
});
```

### Send Message

To send a message, you need to have a channel and a set user.

```javascript
// send message
await channel.sendMessage('Hello World!');
```

### Events

To fetch recent messages, load previous messages, or listen to channel events, use the exported functions on `channel` object.

```javascript
// receive the last 20 messages
const messages = await channel.loadRecentMessages(20);

// receive the 5 previous messages
const previousMessages = await channel.loadPreviousMessages(5);

// watch new messages
channel.onMessageReceived((message) => {
  // add message to the UI
});

// watch deleted messages
channel.onMessageDeleted((message) => {
  // remove message from the UI
});

// watch modified messages
channel.onMessageModified((message) => {
  // update message on the UI
})

```

### Reactions

To send a message reaction first, you have to define a `MessageReaction` with a type (E.g. `like`, `dislike`, `love`, etc), and the message ID `message.key`. Then you can send a reaction on a channel.
```typescript
import { MessageReaction } from '@arena-im/chat-types'

const reactionType = 'like';

const reaction: MessageReaction = {
  type: reactionType,
  messageID: message.key,
};

channel.sendReaction(reaction);
```

In the messages, you will have the number of reactions and whether the current user has reacted to these messages.
```typescript
// total reactions in the message
const messageLikes: number = message.reactions[reactionType];

// whether the current user has reacted to the message
const currentUserReacted: boolean = message.currentUserReactions[reactionType]
```

## Other Packages

Besides the high-level SDKs, this repository contains shared packages, helpers and configuration used for SDK
development. If you're using TypeScript, take a look at the resources below:

- [`@arena-im/types`](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types): Types used in all packages.
