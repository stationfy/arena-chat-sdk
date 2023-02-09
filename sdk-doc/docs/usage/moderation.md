---
sidebar_position: 10
---

# Moderation

If the "Request Moderator" option is enabled for your chat, users will be able to request to be moderators.

To understand how this flow works on the embedded chat room you can refer to this [article](https://help.arena.im/en/articles/4092833-how-to-turn-on-a-volunteer-moderator-request-on-a-live-chat).

You can "Request Moderator" by calling this function (it will request moderation for the logged-in user):

```js
channelI.requestModeration();
```

When moderation is granted to the user (via Dashboard or API), the user object will contain the `isModerator` property set to `true`. The current user, who's now a moderator, will be able to delete messages or ban users.

Note: The `isModerator` property will only be `true` after the next page refresh.

```js
// delete a ChatMessage
channelI.deleteMessage(message);

// ban a message sender ChatMessageSender
channelI.banUser(message.sender);
```

To verify if the current user was banned, check the property `isBanned` in the user object.
