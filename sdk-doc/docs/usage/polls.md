---
sidebar_position: 13
---

# Polls

Adding polls to engage the user experience is quite simple since it's enabled by default in all chats

First you'll need to get the Polls instance using a channel instance.

```js
const pollsI = await channelI.getPollsInstance()
```

Once you get a polls instance it's possible to start loading the existing polls The enum `PollFilter` defined in [types](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types) can be used to filter the list of polls to be loaded.

```js
enum PollFilter {
  POPULAR = 'popular', // The most voted polls
  RECENT = 'recent', // The recent polls by date
  ACTIVE = 'active', // All active polls
  ENDED = 'ended', // The already finished polls
}
```

```js
const pollsList: [Poll] = await pollsI.loadPolls(
  PollFilter.RECENT,
  50 // optional
)
```

To register a vote in a option for a poll you need to inform the `pollId` the `optionIndex` that is a number starting in 0 and optionally an `anonymousId`

```js
await pollsI.pollVote(
  pollId,
  5, // option index
  anonymousUserId // optional. Only provide this information if it's an anonymous vote.
)
```

You can create Polls using the following method as a chat moderator:

```js
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

```js
pollsI.deletePoll(
  poll: Poll // a poll object
)
```

Event listeners are exposed to watch for changes in real-time:

- **onPollReceived**: Allows you to watch for new polls in real time to notify or display to users. The same signature works for onPollModified and onPollDeleted
```js
pollsI.onPollReceived(callback: (poll: Poll) => void): void
```

- **offPollReceived** : Unregister a previous registered listener for onPollReceived, the same is valid for offPollModified and offPollDeleted
```js
pollsI.offPollReceived()
```
