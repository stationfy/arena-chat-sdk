import { RealtimeAPI } from '@services/realtime-api';
import { ChatMessage } from '@models/chat-message';
import {
  listenToCollectionChange,
  listenToDocumentChange,
  fetchCollectionItems,
  listenToCollectionItemChange,
} from '@services/firestore-api';
import { ChatRoom } from '@models/chat-room';

jest.mock('@services/firestore-api', () => ({
  listenToCollectionChange: jest.fn(),
  listenToDocumentChange: jest.fn(),
  fetchCollectionItems: jest.fn(),
  listenToCollectionItemChange: jest.fn(),
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

  describe('listenToChatConfigChanges()', () => {
    it('should call the callback function with the chat config', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToDocumentChange.mockImplementation((_, callback) => {
        const chatRoom: ChatRoom = {
          allowSendGifs: true,
          allowShareUrls: true,
          chatAutoOpen: false,
          chatClosedIsEnabled: false,
          chatPreModerationIsEnabled: false,
          chatPreviewEnabled: true,
          chatRequestModeratorIsEnabled: false,
          createdAt: 1592335254033,
          id: 'new-chatroom',
          lang: 'en-us',
          language: 'en-us',
          name: 'My First ChatRoom',
          presenceId: 'pesence-id',
          reactionsEnabled: true,
          showOnlineUsersNumber: true,
          signUpRequired: false,
          signUpSettings: {
            suggest: true,
            type: 'REQUIRED',
          },
          siteId: 'site-id',
          slug: 'crsl',
          standalone: false,
        };

        callback(chatRoom);
      });

      realtimeAPI.listenToChatConfigChanges((chatRoom: ChatRoom) => {
        expect(chatRoom.id).toEqual('new-chatroom');
        done();
      });
    });
  });

  describe('fetchRecentMessages()', () => {
    it('should fetch recent messages', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

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

  describe('listenToChatNewMessage()', () => {
    it('should receive a added message', (done) => {
      const realtimeAPI = new RealtimeAPI('my-channel');

      // @ts-ignore
      listenToCollectionItemChange.mockImplementation((_, callback: (message: ChatMessage) => void) => {
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
          changeType: 'added',
        };

        callback(message);
      });

      realtimeAPI.listenToChatNewMessage((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');

        done();
      });
    });
  });

  describe('fetchPreviousMessages()', () => {
    it('should fetch previous messages', async () => {
      const realtimeAPI = new RealtimeAPI('my-channel');

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

      // @ts-ignore
      fetchCollectionItems.mockImplementation(async () => {
        const messages: ChatMessage[] = [
          {
            ...message,
            key: 'fake-key',
          },
          {
            ...message,
            key: 'fake-key-1',
          },
          {
            ...message,
            key: 'fake-key-2',
          },
          {
            ...message,
            key: 'fake-key-3',
          },
        ];

        return messages;
      });

      const messages = await realtimeAPI.fetchPreviousMessages(message, 3);

      expect(messages).toEqual([
        {
          ...message,
          key: 'fake-key-3',
        },
        {
          ...message,
          key: 'fake-key-2',
        },
        {
          ...message,
          key: 'fake-key-1',
        },
      ]);
    });
  });
});
