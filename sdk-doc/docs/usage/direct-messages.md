---
sidebar_position: 12
---

# Direct Messages

When you enable the "Private Messages" option in your chat, members can chat directly with each other.

To create a private channel with a user start calling the following method with the given options. See types

```js
import PrivateChannel from '@/channel/private-channel.ts'

const peterChannel: BasePrivateChannel = await PrivateChannel.createUserChannel({
  user: new ExternalUser(userParams),
  userId: "id0",
  site: new Site(siteOptions),
  firstMessage: new ChatMessageContent(messageContent); //optional
})
```

To list all private channels for the current user you can do like

```js
const userChannels: BasePrivateChannel[] = await PrivateChannel.getUserChannels(currentUser, currentSite)
```

To allow your users to block another users inside a private channel context use

```js
const userBlocked: Boolean = await PrivateChannel.blockPrivateUser(currentUser, currentSite, targetUserId)
```

The same is valid to unblock another blocked user

```js
const userUnblocked: Boolean = await PrivateChannel.unblockPrivateUser(currentUser, currentSite, targetUserId)
```

To send a private message on a specific channel you can call the following method

```js
await peterChannel.sendMessage(
  new ChatMessageContent(messageOptions)
  replyMessageId, // optional
  "temporaryId"
)
```

It's also possible to obtain an already created private channel directly throught the sdk by passing the channelId

```js
const aliceChannel: BasePrivateChannel = await arenaChat.getPrivateChannel("alice-channel")
```

In the same way we can list only the private channels that are not group channels for the current user

```js
const userPrivateChannels: BasePrivateChannel[] = await arenaChat.getUserPrivateChannel()
```

Also, it's possible to create a channel via ArenaChat instance or return an existing one for a userId

```js
const bobChannel: BasePrivateChannel = await arenaChat.createUserPrivateChannel(
  "bobUserId",
  new ChatMessageContent(messageParams) // optional
)
```

About the event listeners this one deserves attention, types are defined here types

- **onUnreadMessagesCountChanged** : Watchs for unread messages within a private channel so you can display it for the user in real time, callback will hold the unread count
```js
onUnreadMessagesCountChanged(user: ExternalUser, site: Site, callback: (total: number) => void): () => void
```

- **offUnreadMessagesCountChanged** : From the sdk you can unsubscribe the a previous setted listener for onUnreadMessagesCountChanged
```js
arenaChat.offUnreadMessagesCountChanged()
```
