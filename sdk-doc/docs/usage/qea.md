---
sidebar_position: 11
---

# Q&A

When a Q&A session is enabled for the Chat Room, you can implement the basic Q&A functionality using this module.

First you'll need to get the Q&A instance using a channel instance.

```js
// get qna props
const qnaI = await channelI.getChatQnaInstance()
```

Now is possible to start loading the previously created questions. Just pass a limit of questions to be loaded and the `QnaQuestionFilter`, wich is also defined in [types](https://github.com/stationfy/arena-chat-sdk/tree/master/packages/types). Both parameters are optional.

```js
const questions: [QnaQuestion] = await qnaI.loadQuestions(50, QnaQuestionFilter.RECENT)
```

Start adding new questions just by passing its contents.

```js
await qnaI.addQuestion("Which team shall win tonight?")
```

It's also possible to easily awnser a question by calling the following method with the question (`QnaQuestion`) and the answer (`string`).

```js
const isQuestionAwnsered: Boolean = await qnaI.answerQuestion(question, "Lakers should win!")
```

To delete questions you can use the following method. It's important to mention that the user who sent the question can delete it and moderators can delete any message.

```js
await qnaI.deleteQuestion(
  question: QnaQuestion // a qnaQuestion object
)
```

#### Upvote

The current user can upvote a question by calling the following method with the question (`QnaQuestion`) and optionally an `anonymousId`:

```js
await qnaI.upvoteQuestion(
  question,
  anonymousId // optional. Only provide this information if it's an anonymous vote.
)
```

In the questions, you will have the number of upvotes and whether the current user has upvoted to these questions.

```js
// total reactions in the question
question.upvotes

// whether the current user has upvoted to the message
question.userVoted
```

#### Listeners

To listen to changes to questions in real-time, some listeners can be used:

- **onChange**: This will watch for Q&A props changes coming from dashboard and then call the passed callback with the Qna instance updating it properties
```js
qnaI.onChange(callback: (instance: BaseQna) => void): void
```

- **onQuestionReceived**: Watches for new questions received
```js
qnaI.onQuestionReceived(callback: (question: QnaQuestion) => void): void
```

- **onQuestionModified**: Watches for the questions updated
```js
qnaI.onQuestionModified(callback: (question: QnaQuestion) => void): void
```

- **onQuestionDeleted**: Watches for the questions deleted
```js
qnaI.onQuestionDeleted(callback: (question: QnaQuestion) => void): void
```

To stop listen the previous events you can call:

```js
qnaI.offQuestionReceived()
qnaI.offQuestionModified()
qnaI.offQuestionDeleted()
qnaI.offChange()
```
