---
sidebar_position: 6
---

# Send Message

To send a simple text message, you need to have a channel and a set user.

```js
// send message
await channelI.sendMessage({text: 'Hello World!'});
```

You can send a message with a media URL attached to it.

```js
// send message
await channelI.sendMessage({mediaURL: 'https://ps.w.org/arena-liveblog-and-chat-tool/assets/icon-256x256.png'});
```
