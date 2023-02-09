---
sidebar_position: 9
---

# Reactions

You have to define a `MessageReaction` with a type (E.g. `like`, `dislike`, `love`, etc), and the message ID `message.key`.

Then you can send a reaction on a message.

```js
import { MessageReaction } from '@arena-im/chat-types'

const reactionType = 'like';

const reaction: MessageReaction = {
  type: reactionType,
  messageID: message.key,
};

channelI.sendReaction(reaction);
```

You can also remove a reaction on a message.

```js
import { MessageReaction } from '@arena-im/chat-types'

const reactionType = 'like';

const reaction: MessageReaction = {
  type: reactionType,
  messageID: message.key,
};

channelI.deleteReaction(reaction);
```

In the messages, you will have the number of reactions and whether the current user has reacted to these messages.

```js
// total reactions in the message
const messageLikes: number = message.reactions[reactionType];

// whether the current user has reacted to the message
const currentUserReacted: boolean = message.currentUserReactions[reactionType]
```
