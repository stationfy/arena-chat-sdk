import { DocumentChange, DocumentData } from 'firebase/firestore';
import { RealtimeApiFirestore } from '../../../src/services/realtime-api/realtime-api-firestore';
import { exampleChatMessage } from '../../fixtures/examples';
import { exampleFirestoreChatroomPath } from '../../fixtures/chat-examples';
import { ChatMessage } from '@arena-im/chat-types';
import { FirestoreAPI } from '@arena-im/core';

jest.mock('@arena-im/core', () => ({
  FirestoreAPI: {
    listenToCollectionChange: jest.fn(),
    listenToDocumentChange: jest.fn(),
    fetchCollectionItems: jest.fn(),
    listenToCollectionItemChange: jest.fn(),
    addItem: jest.fn(),
  },
}));

describe('RealtimeApiFirestore', () => {
  describe('listenToMessage', () => {
    it('should receive a added message', (done) => {
      const realtimeAPI = new RealtimeApiFirestore(exampleFirestoreChatroomPath);

      // @ts-ignore
      FirestoreAPI.listenToCollectionItemChange.mockImplementation(
        (_: string, callback: (changes: DocumentChange<DocumentData>[]) => void) => {
          callback([]);
          callback([
            {
              doc: {
                data: () => exampleChatMessage,
                // @ts-ignore
                type: 'added',
              },
            },
          ]);
        },
      );

      realtimeAPI.listenToMessage((message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');

        done();
      });
    });
  });
  describe('fetchRecentMessages', () => {
    it('should fetch recent messages', async () => {
      const realtimeAPI = new RealtimeApiFirestore(exampleFirestoreChatroomPath);

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = new Array(10).fill(exampleChatMessage);

        return messages;
      });

      const messages = await realtimeAPI.fetchRecentMessages(10);

      expect(messages.length).toBe(10);
    });
  });
  describe('fetchPreviousMessages', () => {
    it('should fetch previous messages', async () => {
      const realtimeAPI = new RealtimeApiFirestore(exampleFirestoreChatroomPath);

      // @ts-ignore
      FirestoreAPI.fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = [
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

      const messages = await realtimeAPI.fetchPreviousMessages(3, exampleChatMessage.createdAt);

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
  describe('close', () => {
    it('should receive a added message', (done) => {
      const realtimeAPI = new RealtimeApiFirestore(exampleFirestoreChatroomPath);
      const mockedUnsubscribe = jest.fn();

      // @ts-ignore
      FirestoreAPI.listenToCollectionItemChange.mockImplementation(
        (_: string, callback: (changes: DocumentChange<DocumentData>[]) => void) => {
          callback([]);
          callback([
            {
              doc: {
                data: () => exampleChatMessage,
                // @ts-ignore
                type: 'added',
              },
            },
          ]);

          return mockedUnsubscribe;
        },
      );

      realtimeAPI.listenToMessage((message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');

        done();
      });

      realtimeAPI.close();

      expect(mockedUnsubscribe).toBeCalledTimes(1);
    });
  });
});
