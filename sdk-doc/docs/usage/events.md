---
sidebar_position: 8
---

# Events

To fetch recent messages, load previous messages, or listen to channel events, use the exported functions on `channel` object.

```js
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

```js
// remove all listeners for new messages on the channel
channelI.offMessageReceived();

// remove all listeners for deleted messages on the channel
channelI.offMessageDeleted();

// remove all listeners for modified message on the channel
channelI.offMessageModified();

// remove all listeners on the channel
channelI.offAllListeners();
```
