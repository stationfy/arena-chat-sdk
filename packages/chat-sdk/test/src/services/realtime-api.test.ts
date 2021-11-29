import { RealtimeAPI } from '@services/realtime-api';
import { ChatMessage, QnaQuestion, QnaQuestionFilter, PollFilter, Poll, LiveChatChannel } from '@arena-im/chat-types';
import { FirestoreAPI } from '@arena-im/core';

import {
  exampleChatMessage,
  exampleChatRoom,
  exampleLiveChatChannel,
  examplePoll,
  exampleQnaQuestion,
} from '../../fixtures/examples';

jest.mock('@arena-im/core', () => ({
  FirestoreAPI: {
    listenToCollectionChange: jest.fn(),
    listenToDocumentChange: jest.fn(),
    fetchCollectionItems: jest.fn(),
    listenToCollectionItemChange: jest.fn(),
    addItem: jest.fn(),
  },
}));

describe('RealtimeAPI', () => {
  describe('listenToMessage()', () => {
    it('should call the callback function with a list of chat message', (done) => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.listenToCollectionChange.mockImplementation((_, callback) => {
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

      realtimeAPI.listenToMessage(
        'my-channel',
        (messages: ChatMessage[]) => {
          expect(messages.length).toEqual(20);
          done();
        },
        20,
      );
    });
  });

  describe('listenToChatConfigChanges()', () => {
    it('should call the callback function with the chat config', (done) => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.listenToDocumentChange.mockImplementation((_, callback) => {
        callback(exampleChatRoom);
      });

      realtimeAPI.listenToChatConfigChanges(
        `/chat-rooms/${exampleChatRoom._id}/channels/${exampleLiveChatChannel._id}`,
        (channel: LiveChatChannel) => {
          expect(channel._id).toEqual('new-chatroom');
          done();
        },
      );
    });
  });

  describe('fetchRecentMessages()', () => {
    it('should fetch recent messages', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
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

      const messages = await realtimeAPI.fetchRecentMessages(exampleLiveChatChannel.dataPath, 10);

      expect(messages.length).toBe(10);
    });
  });

  describe('fetchGroupRecentMessages()', () => {
    it('should featch group channel recent messages', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        exampleChatMessage;
        const messages: ChatMessage[] = new Array(10).fill(exampleChatMessage);

        return messages;
      });

      const messages = await realtimeAPI.fetchGroupRecentMessages(exampleLiveChatChannel._id, 10);

      expect(messages.length).toBe(10);
    });

    it('should featch group channel recent messages from the last cleared timestamp', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        exampleChatMessage;
        const messages: ChatMessage[] = new Array(10).fill(exampleChatMessage);

        return messages;
      });

      const messages = await realtimeAPI.fetchGroupRecentMessages(exampleLiveChatChannel._id, 10, +new Date());

      expect(messages.length).toBe(10);
    });
  });

  describe('listenToMessageReceived()', () => {
    it('should receive a added message', (done) => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.listenToCollectionItemChange.mockImplementation((_, callback: (message: ChatMessage) => void) => {
        callback(exampleChatMessage);
      });

      realtimeAPI.listenToMessageReceived(exampleLiveChatChannel.dataPath, (message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');

        done();
      });
    });
  });

  describe('fetchGroupPreviousMessages', () => {
    it('f', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
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

      const messages = await realtimeAPI.fetchGroupPreviousMessages(
        exampleLiveChatChannel._id,
        exampleChatMessage,
        +new Date(),
        3,
      );

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
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.listenToCollectionItemChange.mockImplementation((_, callback: (poll: Poll) => void) => {
        callback(examplePoll);
      });

      realtimeAPI.listenToPollReceived(exampleLiveChatChannel._id, (poll: Poll) => {
        expect(poll._id).toEqual('fake-poll');

        done();
      });
    });
  });

  describe('listenToGroupMessageReceived()', () => {
    it('should receive a added group message', (done) => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.listenToCollectionItemChange.mockImplementation((_, callback: (message: ChatMessage) => void) => {
        callback(exampleChatMessage);
      });

      realtimeAPI.listenToGroupMessageReceived(exampleLiveChatChannel._id, (message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');

        done();
      });
    });
  });

  describe('fetchPreviousMessages()', () => {
    it('should fetch previous messages', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
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

      const messages = await realtimeAPI.fetchPreviousMessages(exampleLiveChatChannel.dataPath, exampleChatMessage, 3);

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

  describe('fetchAllQnaQuestions()', () => {
    it('should fetch qna questions', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(exampleQnaQuestion);

        return messages;
      });

      const messages = await realtimeAPI.fetchAllQnaQuestions('fake-qna-id', 10);

      expect(messages.length).toBe(10);
    });

    it('should fetch popular qna questions', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(exampleQnaQuestion);

        return messages;
      });

      const messages = await realtimeAPI.fetchAllQnaQuestions('fake-qna-id', 10, QnaQuestionFilter.POPULAR);

      expect(messages.length).toBe(10);
    });
  });

  describe('fetchAllPolls()', () => {
    it('should fetch chat polls', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.POPULAR, 11);

      expect(messages.length).toBe(10);
    });

    it('should fetch all active chat polls', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.ACTIVE, 11);

      expect(messages.length).toBe(10);
    });

    it('should fetch all ended chat polls', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(examplePoll);

        return messages;
      });

      // @ts-ignore
      const messages = await realtimeAPI.fetchAllPolls(PollFilter.ENDED, 11);

      expect(messages.length).toBe(10);
    });

    it('should fetch all recent chat polls', async () => {
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
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
      const realtimeAPI = RealtimeAPI.getInstance();

      // @ts-ignore
      FirestoreAPI.listenToCollectionItemChange.mockImplementation((_, callback: (question: QnaQuestion) => void) => {
        callback({ ...exampleQnaQuestion, changeType: 'added' });
      });

      realtimeAPI.listenToQuestionReceived('my-channel', (question: QnaQuestion) => {
        expect(question.key).toEqual('fake-qna-question');

        done();
      });
    });
  });
});
