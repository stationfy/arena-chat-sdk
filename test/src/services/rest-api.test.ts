import { RestAPI } from '../../../src/services/rest-api';
import { ChatRoom } from '../../../src/types/chat-room';
import { Site } from '../../../src/types/site';
import { BanUser } from '../../../src/types/user';
import { ChatMessage, ChatMessageReport, DeleteChatMessageRequest } from '../../../src/types/chat-message';
import { XHRTransport } from '../../../src/services/xhr-transport';

jest.mock('../../../src/services/xhr-transport', () => ({
  XHRTransport: jest.fn(),
}));

let chatRoom: ChatRoom;
let site: Site;
describe('RestAPI', () => {
  beforeEach(() => {
    chatRoom = {
      allowSendGifs: true,
      allowShareUrls: true,
      chatAutoOpen: false,
      chatClosedIsEnabled: false,
      chatPreModerationIsEnabled: true,
      chatPreviewEnabled: true,
      chatRequestModeratorIsEnabled: true,
      createdAt: 11111111,
      id: '1234',
      lang: 'en-us',
      language: 'en-us',
      name: 'Foo',
      presenceId: '1234',
      reactionsEnabled: true,
      showOnlineUsersNumber: true,
      signUpRequired: false,
      signUpSettings: {
        suggest: false,
        type: 'REQUIRED',
      },
      siteId: '1234',
      slug: 'qewr',
      standalone: true,
    };

    site = {
      _id: '1234',
      displayName: 'hey1',
    };

    // @ts-ignore
    XHRTransport.mockClear();
  });
  describe('sendMessage()', () => {
    it('should send chat message', async () => {
      const message: ChatMessage = {
        createdAt: 1234,
        key: '1234',
        message: {
          text: 'hey!',
        },
        publisherId: '1234',
        sender: {
          displayName: 'Cesar',
          photoURL: 'http://www.google.com',
          isPublisher: false,
        },
      };

      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: (path: string, payload: {}) => Promise.resolve(payload),
          get: () => Promise.resolve(message),
        };
      });

      const restAPI = new RestAPI();

      const response = await restAPI.sendMessage(chatRoom, message);

      expect(response).toEqual(message);
    });
    it('should receive a post error', async () => {
      const message: ChatMessage = {
        createdAt: 1234,
        key: '1236',
        message: {
          text: 'hey!',
        },
        publisherId: '1234',
        sender: {
          displayName: 'Cesar',
          photoURL: 'http://www.google.com',
          isPublisher: false,
        },
      };

      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: () => Promise.reject('failed'),
          get: () => Promise.resolve(message),
        };
      });

      const restAPI = new RestAPI();

      try {
        await restAPI.sendMessage(chatRoom, message);
      } catch (e) {
        expect(e).toEqual('failed');
      }
    });
  });

  describe('reportMessage()', () => {
    const message: ChatMessage = {
      createdAt: 1234,
      key: '1235',
      message: {
        text: 'hey!',
      },
      publisherId: '1234',
      sender: {
        displayName: 'Cesar',
        photoURL: 'http://www.google.com',
        isPublisher: false,
      },
    };

    const report: ChatMessageReport = {
      message: message,
      reportedBy: {
        reportedByType: 'chat',
        uid: '1234',
      },
      key: '1234',
      type: 'chat',
    };

    it('should report a message', async () => {
      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: (path: string, payload: {}) => Promise.resolve(payload),
          get: () => Promise.resolve(message),
        };
      });

      const restAPI = new RestAPI();

      const response = await restAPI.reportMessage(chatRoom, report);

      expect(response).toEqual(report);
    });
    it('should receive a post error', async () => {
      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: () => Promise.reject('failed'),
          get: () => Promise.resolve(message),
        };
      });

      const restAPI = new RestAPI();

      try {
        await restAPI.reportMessage(chatRoom, report);
      } catch (e) {
        expect(e).toEqual('failed');
      }
    });
  });

  describe('requestModeration()', () => {
    it('should request a moderation', async () => {
      const mockPost = jest.fn(() => Promise.resolve());

      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: mockPost,
        };
      });

      const restAPI = new RestAPI();

      await restAPI.requestModeration(site, chatRoom);

      expect(mockPost).toHaveBeenCalledWith('/data/moderation/request-mod-status', {
        chatRoomId: '1234',
        siteId: '1234',
      });
    });
  });

  describe('banUser()', () => {
    it('should ban a user', async () => {
      const banUser: BanUser = {
        anonymousId: '1234',
        image: 'http://www.google.com',
        name: 'Foo',
        siteId: '1234',
      };
      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: () => Promise.resolve(),
        };
      });

      const restAPI = new RestAPI();

      const response = await restAPI.banUser(banUser);

      expect(response).toEqual(undefined);
    });
  });

  describe('deleteMessage()', () => {
    const message: ChatMessage = {
      createdAt: 1234,
      key: '1235',
      message: {
        text: 'hey!',
      },
      publisherId: '1234',
      sender: {
        displayName: 'Cesar',
        photoURL: 'http://www.google.com',
        isPublisher: false,
      },
    };

    it('should delete a message', async () => {
      const mockPost = jest.fn(() => Promise.resolve());
      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: mockPost,
        };
      });

      const request: DeleteChatMessageRequest = {
        data: {
          siteId: site._id,
        },
      };

      const restAPI = new RestAPI();

      await restAPI.deleteMessage(site, chatRoom, message);

      expect(mockPost).toBeCalledWith('/data/chat-room/1234/messages/1235', request);
    });
  });
});
