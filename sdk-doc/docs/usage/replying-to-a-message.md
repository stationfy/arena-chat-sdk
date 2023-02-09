---
sidebar_position: 7
---

# Replying to a Message

To reply a message, you will inform the message ID you want to reply.

```js
// replying to a message
await channelI.sendMessage({text: 'My reply', replyTo: MESSAGE_ID});
```

#### Example:

If you want to reply to a message with `message.key = "Y1D7o00QbXDaapcjoBDH"` you have to call:

```js
await channelI.sendMessage({text: 'My reply', replyTo: 'Y1D7o00QbXDaapcjoBDH'});
```

And then you will receive in the `onMessageReceived` listener the following message with a `replyMessage` property:

```js
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

