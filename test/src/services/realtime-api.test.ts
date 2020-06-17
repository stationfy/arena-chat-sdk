import { RealtimeAPI } from '../../../src/services/realtime-api';
import { ChatMessage } from '../../../src/types/chat-message';
import { listenToCollectionChange, listenToDocumentChange } from '../../../src/services/firestore-api';
import { ChatRoom } from '../../../src/types/chat-room';

jest.mock('../../../src/services/firestore-api', () => ({
  listenToCollectionChange: jest.fn(),
  listenToDocumentChange: jest.fn(),
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
});
