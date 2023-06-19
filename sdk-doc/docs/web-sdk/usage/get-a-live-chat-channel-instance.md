---
sidebar_position: 2
---

# Get a Live Chat Channel Instance

To get the main Live Chat Channel, use the exported methods of `liveChat`. It will return a `Channel` instance.

```js
// get the main channel
const channelI = await liveChatI.getMainChannel();
```

You can use a channel ID to retrieve a `Channel` object.

```js
// get a channel by id
const channelI = await liveChatI.getChannel(YOUR_CHANNEL_ID);
```

The channel ID can be either, the Arena Channel ID or the External ID that you set when you are creating the Channel over the Arena API.
