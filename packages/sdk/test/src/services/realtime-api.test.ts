import { RealtimeAPI } from '@services/realtime-api';
import {
  ChatMessage,
  ServerReaction,
  ExternalUser,
  QnaQuestion,
  QnaQuestionFilter,
  PollFilter,
  Poll,
} from '@arena-im/chat-types';
import {
  listenToCollectionChange,
  listenToDocumentChange,
  fetchCollectionItems,
  listenToCollectionItemChange,
  addItem,
} from '@services/firestore-api';
import { ChatRoom } from '@arena-im/chat-types';
import {
  exampleChatMessage,
  exampleChatRoom,
  exampleLiveChatChannel,
  examplePoll,
  exampleQnaQuestion,
} from '../../fixtures/examples';

jest.mock('@services/firestore-api', () => ({
  listenToCollectionChange: jest.fn(),
  listenToDocumentChange: jest.fn(),
  fetchCollectionItems: jest.fn(),
  listenToCollectionItemChange: jest.fn(),
  addItem: jest.fn(),
}));

describe('RealtimeAPI', () => {
  describe('listenToMessage()', () => {
    it('should call the callback function with a list of chat message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionChange.mockImplementation((_, callback) => {
        const message: ChatMessage = {
          createdAt: 1592342151026,
          key: 'fake-key',
          message: {
            text: 'testing',
          },
          publisherId: 'site-id',
          sender: {
            displayName: 'Test User',
            photoURL: 'http://www.google.com',
          },
        };
        const messages: ChatMessage[] = new Array(20).fill(message);

        callback(messages);
      });

      realtimeAPI.listenToMessage((messages: ChatMessage[]) => {
        expect(messages.length).toEqual(20);
        done();
      }, 20);
    });
  });

  describe('listenToUserReactions()', () => {
    it('should call the callback function with a list of reactions', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionChange.mockImplementation((_, callback) => {
        const reaction: ServerReaction = {
          itemType: 'chatMessage',
          reaction: 'love',
          publisherId: 'fake-site-id',
          itemId: 'fake-message-key',
          chatRoomId: 'fake-chat-room-key',
          userId: 'fake-user-uid',
        };

        const reactions: ServerReaction[] = new Array(20).fill(reaction);

        callback(reactions);
      });

      const user: ExternalUser = {
        id: 'fake-user',
        name: 'Face user',
        image: 'https://www.google.com',
      };

      realtimeAPI.listenToUserReactions(user, (reactions: ServerReaction[]) => {
        expect(reactions.length).toBe(20);

        done();
      });
    });
  });

  describe('listenToChatConfigChanges()', () => {
    it('should call the callback function with the chat config', (done) => {
      const realtimeAPI = new RealtimeAPI(exampleLiveChatChannel._id, exampleLiveChatChannel.dataPath);

      // @ts-ignore
      listenToDocumentChange.mockImplementation((_, callback) => {
        callback(exampleChatRoom);
      });

      realtimeAPI.listenToChatConfigChanges((chatRoom: ChatRoom) => {
        expect(chatRoom._id).toEqual('new-chatroom');
        done();
      });
    });
  });

  describe('fetchRecentMessages()', () => {
    it('should fetch recent messages', async () => {
      const realtimeAPI = new RealtimeAPI(exampleLiveChatChannel._id, exampleLiveChatChannel.dataPath);

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const message: ChatMessage = {
          createdAt: 1592342151026,
          key: 'fake-key',
          message: {
            text: 'testing',
          },
          publisherId: 'site-id',
          sender: {
            displayName: 'Test User',
            photoURL: 'http://www.google.com',
          },
        };
        const messages: ChatMessage[] = new Array(10).fill(message);

        return messages;
      });

      const messages = await realtimeAPI.fetchRecentMessages(10);

      expect(messages.length).toBe(10);
    });
  });

  describe('fetchGroupRecentMessages()', () => {
    it('should featch group channel recent messages', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        exampleChatMessage;
        const messages: ChatMessage[] = new Array(10).fill(exampleChatMessage);

        return messages;
      });

      const messages = await realtimeAPI.fetchGroupRecentMessages(10);

      expect(messages.length).toBe(10);
    });

    it('should featch group channel recent messages from the last cleared timestamp', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        exampleChatMessage;
        const messages: ChatMessage[] = new Array(10).fill(exampleChatMessage);

        return messages;
      });

      const messages = await realtimeAPI.fetchGroupRecentMessages(10, +new Date());

      expect(messages.length).toBe(10);
    });
  });

  describe('listenToMessageReceived()', () => {
    it('should receive a added message', (done) => {
      const realtimeAPI = new RealtimeAPI(exampleLiveChatChannel._id, exampleLiveChatChannel.dataPath);

      // @ts-ignore
      listenToCollectionItemChange.mockImplementation((_, callback: (message: ChatMessage) => void) => {
        callback(exampleChatMessage);
      });

      realtimeAPI.listenToMessageReceived((message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');

        done();
      });
    });
  });

  describe('fetchGroupPreviousMessages', () => {
    it('f', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = [
          {
            ...exampleChatMessage,
            key: 'fake-key',
          },
          {
            ...exampleChatMessage,
            key: 'fake-key-1',
          },
          {
            ...exampleChatMessage,
            key: 'fake-key-2',
          },
          {
            ...exampleChatMessage,
            key: 'fake-key-3',
          },
        ];

        return messages;
      });

      const messages = await realtimeAPI.fetchGroupPreviousMessages(exampleChatMessage, +new Date(), 3);

      expect(messages).toEqual([
        {
          ...exampleChatMessage,
          key: 'fake-key-3',
        },
        {
          ...exampleChatMessage,
          key: 'fake-key-2',
        },
        {
          ...exampleChatMessage,
          key: 'fake-key-1',
        },
      ]);
    });
  });

  describe('listenToPollReceived()', () => {
    it('should receive a added poll', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionItemChange.mockImplementation((_, callback: (poll: Poll) => void) => {
        callback(examplePoll);
      });

      realtimeAPI.listenToPollReceived((poll: Poll) => {
        expect(poll._id).toEqual('fake-poll');

        done();
      });
    });
  });

  describe('listenToGroupMessageReceived()', () => {
    it('should receive a added group message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionItemChange.mockImplementation((_, callback: (message: ChatMessage) => void) => {
        callback(exampleChatMessage);
      });

      realtimeAPI.listenToGroupMessageReceived((message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');

        done();
      });
    });
  });

  describe('fetchPreviousMessages()', () => {
    it('should fetch previous messages', async () => {
      const realtimeAPI = new RealtimeAPI(exampleLiveChatChannel._id, exampleLiveChatChannel.dataPath);

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = [
          {
            ...exampleChatMessage,
            key: 'fake-key',
          },
          {
            ...exampleChatMessage,
            key: 'fake-key-1',
          },
          {
            ...exampleChatMessage,
            key: 'fake-key-2',
          },
          {
            ...exampleChatMessage,
            key: 'fake-key-3',
          },
        ];

        return messages;
      });

      const messages = await realtimeAPI.fetchPreviousMessages(exampleChatMessage, 3);

      expect(messages).toEqual([
        {
          ...exampleChatMessage,
          key: 'fake-key-3',
        },
        {
          ...exampleChatMessage,
          key: 'fake-key-2',
        },
        {
          ...exampleChatMessage,
          key: 'fake-key-1',
        },
      ]);
    });
  });

  describe('sendReaction()', () => {
    it('should react to a message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      const reaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: 'love',
        publisherId: 'fake-site-id',
        itemId: 'fake-message-key',
        chatRoomId: 'fake-chat-room-key',
        userId: 'fake-user-uid',
      };

      // @ts-ignore
      addItem.mockImplementation(async () => {
        return;
      });

      realtimeAPI.sendReaction(reaction).then(() => {
        done();
      });
    });

    it('should handle a react error', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      const reaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: 'love',
        publisherId: 'fake-site-id',
        itemId: 'fake-message-key',
        chatRoomId: 'fake-chat-room-key',
        userId: 'fake-user-uid',
      };

      // @ts-ignore
      addItem.mockImplementation(async () => {
        throw new Error('cannot set this doc');
      });

      realtimeAPI.sendReaction(reaction).catch((e) => {
        expect(e.message).toEqual('failed');
        done();
      });
    });
  });

  describe('fetchAllQnaQuestions()', () => {
    it('should fetch qna questions', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(exampleQnaQuestion);

        return messages;
      });

      const messages = await realtimeAPI.fetchAllQnaQuestions('fake-qna-id', 10);

      expect(messages.length).toBe(10);
    });

    it('should fetch popular qna questions', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(exampleQnaQuestion);

        return messages;
      });

      const messages = await realtimeAPI.fetchAllQnaQuestions('fake-qna-id', 10, QnaQuestionFilter.POPULAR);

      expect(messages.length).toBe(10);
    });
  });

  describe('fetchAllPolls()', () => {
    it('should fetch chat polls', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.POPULAR, 11);

      expect(messages.length).toBe(10);
    });

    it('should fetch all active chat polls', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.ACTIVE, 11);

      expect(messages.length).toBe(10);
    });

    it('should fetch all ended chat polls', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.ENDED, 11);

      expect(messages.length).toBe(10);
    });

    it('should fetch all recent chat polls', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.RECENT, 11);

      expect(messages.length).toBe(10);
    });
  });

  describe('listenToQuestionReceived()', () => {
    it('should receive a added question', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionItemChange.mockImplementation((_, callback: (question: QnaQuestion) => void) => {
        callback({ ...exampleQnaQuestion, changeType: 'added' });
      });

      realtimeAPI.listenToQuestionReceived((question: QnaQuestion) => {
        expect(question.key).toEqual('fake-qna-question');

        done();
      });
    });
  });
});
