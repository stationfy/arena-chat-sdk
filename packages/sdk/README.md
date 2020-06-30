# Arena Chat SDK

arena-chat-sdk is the official JavaScript client for Arena Chat, a service for building chat applications.

You can sign up for a Arena account at https://dashboard.arena.im/.

## Installation

### Install with NPM

```bash
npm install arena-chat-sdk
```

### Install with Yarn

```bash
yarn add arena-chat-sdk
```

## Usage

To use this SDK, call `ArenaChat(YOUR_SITE_SLUG)` as early as possible after loading the page. This will initialize the SDK and hook into the environment.

```javascript
import ArenaChat from '@arena-im/chat-sdk';

const arenaChat = new ArenaChat('my-site-slug');
```

To get a channel or set a user, use the exported functions of `arenaChat`.

```javascript
// get a channel with chat slug
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
channel.onMessageReceived((message) => {
  // add message to the UI
});

// watch deleted messages
channel.onMessageDeleted((message) => {
  // remove message from the UI
});

```

### API Documentation

Documentation for this JavaScript client are available at the [Arena website](https://arena.im)
