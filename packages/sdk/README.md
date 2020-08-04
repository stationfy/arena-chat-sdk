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

#### Remove Listeners

```javascript
// remove all listeners for new messages on the channel
channel.offMessageReceived();

// remove all listeners for deleted messages on the channel
channel.offMessageDeleted();

// remove all listeners for modified message on the channel
channel.offMessageModified();

// remove all listeners on the channel
channel.offAllListeners();
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

### API Documentation

Documentation for this JavaScript client are available at the [Arena website](https://arena.im)
