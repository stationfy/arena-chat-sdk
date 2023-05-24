import { RealtimeApiWS } from '../../../src/services/realtime-api/realtime-api-ws';
import { ArenaSocket, Logger } from '@arena-im/core';
import { ChatMessage } from '@arena-im/chat-types';
import { exampleChatMessage } from '../../fixtures/examples';
import { exampleChannelId, exampleChatroomId } from '../../fixtures/chat-examples';

jest.mock('@arena-im/core', () => ({
  ArenaSocket: {
    getInstance: jest.fn(() => {
      return {
        on: jest.fn(),
        close: jest.fn(),
      };
    }),
  },
  Logger: {
    instance: jest.fn(() => {
      return {
        log: jest.fn(),
      };
    }),
  },
}));

describe('RealtimeAPI-WS', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    Logger.instance.log = jest.fn();
  });
  const mockedUnsubscribe = jest.fn();

  const mockedListenerCallback = (_: string, callback: (value: any) => void) => {
    callback(exampleChatMessage);
    return mockedUnsubscribe;
  };

  describe('listenToMessage', () => {
    it('should receive a added message', (done) => {
      // @ts-ignore
      ArenaSocket.getInstance.mockImplementation(() => ({
        on: mockedListenerCallback,
        close: jest.fn(),
      }));

      const realtimeAPI = new RealtimeApiWS(exampleChatroomId, exampleChannelId, jest.fn());

      realtimeAPI.listenToMessage((message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');
        done();
      });
    });
  });
  describe('fetchRecentMessages', () => {
    it('should fetch recent messages', async () => {
      // @ts-ignore
      ArenaSocket.getInstance.mockImplementation(() => ({
        on: jest.fn(),
        send: async () => {
          return new Array(10).fill(exampleChatMessage);
        },
        close: jest.fn(),
      }));

      const realtimeAPI = new RealtimeApiWS(exampleChatroomId, exampleChannelId, jest.fn());

      const messages = await realtimeAPI.fetchRecentMessages(10);

      expect(messages.length).toBe(10);
    });
  });
  describe('fetchPreviousMessages', () => {
    it('should fetch previous messages', async () => {
      // @ts-ignore
      ArenaSocket.getInstance.mockImplementation(() => ({
        on: jest.fn(),
        send: async () => {
          const messages: ChatMessage[] = [
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
          ];

          return messages;
        },
        close: jest.fn(),
      }));

      const realtimeAPI = new RealtimeApiWS(exampleChatroomId, exampleChannelId, jest.fn());

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
      // @ts-ignore
      ArenaSocket.getInstance.mockImplementation(() => ({
        on: mockedListenerCallback,
        close: jest.fn(),
      }));

      const realtimeAPI = new RealtimeApiWS(exampleChatroomId, exampleChannelId, jest.fn());

      realtimeAPI.listenToMessage((message: ChatMessage) => {
        expect(message.key).toEqual('fake-message');
        done();
      });

      realtimeAPI.close();

      expect(mockedUnsubscribe).toBeCalledTimes(4);
    });
  });
});
