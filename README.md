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

## Table of contents

  1. [Installation](#installation)
  1. [Usage](#usage)
      1. [Examples](#examples)
      1. [Initialize](#initialize)
      1. [Get Live Chat](#get-live-chat)
      1. [Get a Live Chat Channel Instance](#get-a-live-chat-channel-instance)
      1. [List all Live Chat's Channels](#list-all-live-chats-channels)
      1. [Get Live Chat's Members](#get-live-chats-members)
      1. [Set User](#set-user)
      1. [Send Message](#send-message)
      1. [Replying to a Message](#replying-to-a-message)
      1. [Events](#events)
      1. [Reactions](#reactions)
      1. [Moderation](#moderation)
      1. [Q&A](#qa)
      1. [Direct Messages](#direct-messages)
      1. [Polls](#polls)
  1. [Other Packages](#other-packages)
  1. [Changelogs](#changelogs)

## Installation

To install the SDK, simply add it to your project:

```sh
npm install --save @arena-im/chat-sdk
yarn add @arena-im/chat-sdk
```

## Usage

### Examples
You can find all examples [here](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/sdk/examples)
- [Reactjs live example](https://codesandbox.io/s/distracted-yalow-nm0d7)
- [Vuejs live example](https://codesandbox.io/s/magical-jennings-seqr5)

### Initialize

To initialize the SDK you'll need your site slug and a chat room slug and both can be obtained from the Arena Dashboard or using the Platform API.

You can find your site slug in the dashboard settings: https://dashboard.arena.im/settings/site.

To access the chat room slug, go to the [chat list page](https://dashboard.arena.im/chatlist), find the chat and take the last route param as in the example below:

<img width="998" alt="Screen Shot 2021-05-12 at 08 02 26" src="https://user-images.githubusercontent.com/5726140/117965047-b5ffb600-b2f8-11eb-9f6c-ddfbff2f11c1.png">


```javascript
import ArenaChat from '@arena-im/chat-sdk';

const arenaChat = new ArenaChat('my-site-slug');
```

### Get Live Chat
A Live Chat is the main Chat Room that holds the channels. To get a Live Chat, use the exported methods of `arenaChat`. It will return a `LiveChat` instance.

```javascript
// get a Live Chat with chat slug
const liveChatI = await arenaChat.getLiveChat(YOUR_CHAT_SLUG);
```

### Get a Live Chat Channel Instance

To get the main Live Chat Channel, use the exported methods of `liveChat`. It will return a `Channel` instance.

```javascript
// get the main channel
const channelI = await liveChatI.getMainChannel();
```

You can use a channel ID to retrieve a `Channel` object.
```javascript
// get a channel by id
const channelI = await liveChatI.getChannel(YOUR_CHANNEL_ID);
```

The channel ID can be either, the Arena Channel ID or the External ID that you set when you are creating the Channel over the Arena API.

### List all Live Chat's Channels

You can get the list of all channels data in your Live Chat using the export methods of `liveChat`. It will return a list of `LiveChatChannel` object.

```javascript
const channels = await liveChatI.getChannels()
```

### Get Live Chat's Members

To get the members of a Live Chat, use the export methods of `liveChat`. It will return a list of `PublicUser` object.

```javascript
// array of PublicUser
const members = await liveChatI.getMembers();
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

To send a simple text message, you need to have a channel and a set user.

```javascript
// send message
await channelI.sendMessage({text: 'Hello World!'});
```

You can send a message with a media URL attached to it.

```javascript
// send message
await channelI.sendMessage({mediaURL: 'https://ps.w.org/arena-liveblog-and-chat-tool/assets/icon-256x256.png'});
```

### Replying to a Message

To reply a message, you will inform the message ID you want to reply.

```javascript
// replying to a message
await channelI.sendMessage({text: 'My reply', replyTo: MESSAGE_ID});
```

#### Example:

If you want to reply to a message with `message.key = "Y1D7o00QbXDaapcjoBDH"` you have to call:

```javascript
await channelI.sendMessage({text: 'My reply', replyTo: 'Y1D7o00QbXDaapcjoBDH'});
```

And then you will receive in the `onMessageReceived` listener the following message with a `replyMessage` property:

```json
{
  "message": {
    "text": "My reply"
  },
  "createdAt": 1608311250874,
  "key": "ogdccUkf7D3utKuOf9mG",
  "referer": "http://localhost:3000/",
  "sender": {
    "uid": "5ef364fe3bd61c000887ddc5",
    "photoURL": "https://stationfy.imgix.net/cache/1593009406128-1.jpg",
    "moderator": true,
    "label": "MOD",
    "displayName": "Naomi Carter"
  },
  "replyMessage": {
    "createdAt": 1608211110985,
    "sender": {
      "displayName": "test",
      "anonymousId": "-MOkqMjr_eH5SJRSNJrn",
      "photoURL": "http://localhost:3000/public/imgs/icon-avatar-anonymous.svg"
    },
    "key": "Y1D7o00QbXDaapcjoBDH",
    "message": {
      "text": "test"
    },
    "referer": "http://localhost:8080/"
  },
  "changeType": "added"
}
```

### Events

To fetch recent messages, load previous messages, or listen to channel events, use the exported functions on `channel` object.

```javascript
// receive the last 20 messages
const messages = await channelI.loadRecentMessages(20);

// receive the 5 previous messages
const previousMessages = await channelI.loadPreviousMessages(5);

// watch new messages
channelI.onMessageReceived((message) => {
  // add message to the UI
});

// watch deleted messages
channelI.onMessageDeleted((message) => {
  // remove message from the UI
});

// watch modified messages
channelI.onMessageModified((message) => {
  // update message on the UI
})
```

#### Remove Listeners

```javascript
// remove all listeners for new messages on the channel
channelI.offMessageReceived();

// remove all listeners for deleted messages on the channel
channelI.offMessageDeleted();

// remove all listeners for modified message on the channel
channelI.offMessageModified();

// remove all listeners on the channel
channelI.offAllListeners();
```

### Reactions

You have to define a `MessageReaction` with a type (E.g. `like`, `dislike`, `love`, etc), and the message ID `message.key`.

Then you can send a reaction on a message.

```typescript
import { MessageReaction } from '@arena-im/chat-types'

const reactionType = 'like';

const reaction: MessageReaction = {
  type: reactionType,
  messageID: message.key,
};

channelI.sendReaction(reaction);
```
You can also remove a reaction on a message.

```typescript
import { MessageReaction } from '@arena-im/chat-types'

const reactionType = 'like';

const reaction: MessageReaction = {
  type: reactionType,
  messageID: message.key,
};

channelI.deleteReaction(reaction);
```

In the messages, you will have the number of reactions and whether the current user has reacted to these messages.

```typescript
// total reactions in the message
const messageLikes: number = message.reactions[reactionType];

// whether the current user has reacted to the message
const currentUserReacted: boolean = message.currentUserReactions[reactionType]
```

### Moderation

If the "Request Moderator" option is enabled for your chat, users will be able to request to be moderators.

To understand how this flow works on the embedded chat room you can refer to this [article](https://help.arena.im/en/articles/4092833-how-to-turn-on-a-volunteer-moderator-request-on-a-live-chat).

You can "Request Moderator" by calling this function (it will request moderation for the logged-in user):
```typescript
channelI.requestModeration();
```

When moderation is granted to the user (via Dashboard or API), the user object will contain the `isModerator` property set to `true`. The current user, who's now a moderator, will be able to delete messages or ban users.

Note: The `isModerator` property will only be `true` after the next page refresh.

```typescript
// delete a ChatMessage
channelI.deleteMessage(message);

// ban a message sender ChatMessageSender
channelI.banUser(message.sender);
```

To verify if the current user was banned, check the property `isBanned` in the user object.

### Q&A

When a Q&A session is enabled for the Chat Room, you can implement the basic Q&A functionality using this module.

First you'll need to get the Q&A instance using a channel instance.

```typescript
// get qna props
const qnaI = await channelI.getChatQnaInstance()
```

Now is possible to start loading the previously created questions. Just pass a limit of questions to be loaded and the `QnaQuestionFilter`, wich is also defined in [types](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types). Both parameters are optional.

```typescript
const questions: [QnaQuestion] = await qnaI.loadQuestions(50, QnaQuestionFilter.RECENT)
```

Start adding new questions just by passing its contents

```typescript
await qnaI.addQuestion("Which team shall win tonight?")
```

It's also possible to easily awnser a question by calling the following method with the question (`QnaQuestion`) and the answer (`string`).

```typescript
const isQuestionAwnsered: Boolean = await qnaI.answerQuestion(question, "Lakers should win!")
```

To delete questions you can use the following method. It's important to mention that the user who sent the question can delete it and moderators can delete any message. 

```typescript
await qnaI.deleteQuestion(
  question: QnaQuestion // a qnaQuestion object
)
```

##### Upvote

The current user can upvote a question by calling the following method with the question (`QnaQuestion`) and optionally an `anonymousId`:

```typescript
await qnaI.upvoteQuestion(
  question,
  anonymousId // optional. Only provide this information if it's an anonymous vote.
)
```

In the questions, you will have the number of upvotes and whether the current user has upvoted to these questions.

```typescript
// total reactions in the question
question.upvotes

// whether the current user has upvoted to the message
question.userVoted
```

##### Listeners

To listen to changes to questions in real-time, some listeners can be used:

- onChange: This will watch for Q&A props changes coming from dashboard and then call the passed callback with the Qna instance updating it properties
```typescript
qnaI.onChange(callback: (instance: BaseQna) => void): void
```

- onQuestionReceived: Watches for new questions received
```typescript
qnaI.onQuestionReceived(callback: (question: QnaQuestion) => void): void
```

- onQuestionModified: Watches for the questions updated
```typescript
qnaI.onQuestionModified(callback: (question: QnaQuestion) => void): void
```

- onQuestionDeleted: Watches for the questions deleted
```typescript
qnaI.onQuestionDeleted(callback: (question: QnaQuestion) => void): void
```

To stop listen the previous events you can call:
```typescript
qnaI.offQuestionReceived()
qnaI.offQuestionModified()
qnaI.offQuestionDeleted()
qnaI.offChange()
```

### Direct Messages

When you enable the "Private Messages" option in your chat, members can chat directly with each other.

To create a private channel with a user start calling the following method with the given options. See [types]('https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types')

```typescript
import PrivateChannel from '@/channel/private-channel.ts'

const peterChannel: BasePrivateChannel = await PrivateChannel.createUserChannel({
  user: new ExternalUser(userParams),
  userId: "id0",
  site: new Site(siteOptions),
  firstMessage: new ChatMessageContent(messageContent); //optional
})

```
To list all private channels for the current user you can do like

```typescript
const userChannels: BasePrivateChannel[] = await PrivateChannel.getUserChannels(currentUser, currentSite)
```

To allow your users to block another users inside a private channel context use

```typescript
const userBlocked: Boolean = await PrivateChannel.blockPrivateUser(currentUser, currentSite, targetUserId)
```

The same is valid to unblock another blocked user

```typescript
const userUnblocked: Boolean = await PrivateChannel.unblockPrivateUser(currentUser, currentSite, targetUserId)
```

To send a private message on a specific channel you can call the following method

```typescript
await peterChannel.sendMessage(
  new ChatMessageContent(messageOptions)
  replyMessageId, // optional
  "temporaryId"
)
```

It's also possible to obtain an already created private channel directly throught the sdk by passing the `channelId`

```typescript
const aliceChannel: BasePrivateChannel = await arenaChat.getPrivateChannel("alice-channel")
```

In the same way we can list only the private channels that are not group channels for the current user

```typescript
const userPrivateChannels: BasePrivateChannel[] = await arenaChat.getUserPrivateChannel()
```

Also, it's possible to create a channel via `ArenaChat` instance or return an existing one for a userId

```typescript
const bobChannel: BasePrivateChannel = await arenaChat.createUserPrivateChannel(
  "bobUserId",
  new ChatMessageContent(messageParams) // optional
)
```

About the event listeners this one deserves attention, types are defined here [types]('https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types')

- onUnreadMessagesCountChanged : Watchs for unread messages within a private channel so you can display it for the user in real time, callback will hold the unread count

```typescript
onUnreadMessagesCountChanged(user: ExternalUser, site: Site, callback: (total: number) => void): () => void
```

- offUnreadMessagesCountChanged : From the sdk you can unsubscribe the a previous setted listener for `onUnreadMessagesCountChanged`

```typescript
arenaChat.offUnreadMessagesCountChanged()
```

### Polls

Adding polls to engage the user experience is quite simple since it's enabled by default in all chats

First you'll need to get the Polls instance using a channel instance.

```typescript
const pollsI = await channelI.getPollsInstance()
```

Once you get a polls instance it's possible to start loading the existing polls
The enum `PollFilter` defined in [types](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types) can be used to filter the list of polls to be loaded.

```typescript
enum PollFilter {
  POPULAR = 'popular', // The most voted polls
  RECENT = 'recent', // The recent polls by date
  ACTIVE = 'active', // All active polls
  ENDED = 'ended', // The already finished polls
}
```

```typescript
const pollsList: [Poll] = await pollsI.loadPolls(
  PollFilter.RECENT,
  50 // optional
)
```

To register a vote in a option for a poll you need to inform the `pollId` the `optionIndex` that is a number starting in 0 and optionally an `anonymousId`

```typescript
await pollsI.pollVote(
  pollId,
  5, // option index
  anonymousUserId // optional. Only provide this information if it's an anonymous vote.
)
```

You can create Polls using the following method as a chat moderator:

```typescript
pollsI.createPoll(
  poll: {
    draft: boolean;
    duration?: number; // seconds
    options: string[];
    question: string;
    showVotes: boolean;
  }
)
```

You can delete Polls using the following method as a chat moderator:

```typescript
pollsI.deletePoll(
  poll: Poll // a poll object
)
```

Event listeners are exposed to watch for changes in real-time:

- onPollReceived: Allows you to watch for new polls in real time to notify or display to users. The same signature works for  `onPollModified` and `onPollDeleted`

```typescript
pollsI.onPollReceived(callback: (poll: Poll) => void): void
```

- offPollReceived : Unregister a previous registered listener for `onPollReceived`, the same is valid for `offPollModified` and `offPollDeleted`

```typescript
pollsI.offPollReceived()
```

## Other Packages

Besides the high-level SDKs, this repository contains shared packages, helpers and configuration used for SDK
development. If you're using TypeScript, take a look at the resources below:

- [`@arena-im/types`](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types): Types used in all packages.

## Changelogs

### v2.4.5(Dec 15, 2021)

- Bug fix: polls object update

### v2.4.4(Dec 14, 2021)

- Bug fix: send a message with a pre defined sender

### v2.3.1(Nov 3, 2021)

- Minor adjustments to Polls docs

### v2.3.0(Nov 1, 2021)

- Feature: create and delete polls.
- Bug fix: `channelI.getPollsInstance` typo.

### v2.2.6(Sep 17, 2021)

- Fix user request moderation.

### v2.0.22(Mar 25, 2021)

- Minor adjustments to the Q&A doc

### v2.0.21(Mar 15, 2021)

- Minor adjustments to Polls and Q&A docs

### v2.0.20(Mar 8, 2021)

- Bug fix: Kaspersky antivirus was breaking the real-time feature. 
