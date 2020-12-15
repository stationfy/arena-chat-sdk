import { RestAPI } from '@services/rest-api';
import { ChatRoom, ExternalUser, SSOExchangeResult } from '@arena-im/chat-types';
import { Site } from '@arena-im/chat-types';
import { BanUser, ProviderUser } from '@arena-im/chat-types';
import { ChatMessage, ChatMessageReport, DeleteChatMessageRequest } from '@arena-im/chat-types';
import { XHRTransport } from '@services/xhr-transport';
import { exampleSite } from '../../fixtures/examples';

jest.mock('@services/xhr-transport', () => ({
  XHRTransport: jest.fn(),
}));

let chatRoom: ChatRoom;
let site: Site;
describe('RestAPI', () => {
  beforeEach(() => {
    // @ts-ignore
    chatRoom = {
      allowSendGifs: true,
      allowShareUrls: true,
      chatAutoOpen: false,
      chatClosedIsEnabled: false,
      chatPreModerationIsEnabled: true,
      chatPreviewEnabled: true,
      chatRequestModeratorIsEnabled: true,
      createdAt: 11111111,
      _id: '1234',
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

    site = exampleSite;

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
          post: function <T>(_: string, payload: T) {
            return Promise.resolve(payload);
          },
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
          post: function <T>(_: string, payload: T) {
            return Promise.resolve(payload);
          },
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
        siteId: 'site-id',
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
          delete: mockPost,
        };
      });

      const request: DeleteChatMessageRequest = {
        siteId: site._id,
      };

      const restAPI = new RestAPI();

      await restAPI.deleteMessage(site, chatRoom, message);

      expect(mockPost).toBeCalledWith('/data/chat-room/1234/messages/1235', request);
    });
  });
  describe('getArenaUser()', () => {
    it('should get a user', async () => {
      const mockPost = jest.fn(() => {
        const data: SSOExchangeResult = {
          data: {
            // @ts-ignore
            user: {
              thumbnails: {
                raw: 'https://www.google.com',
              },
              functionType: [],
              adminType: [],
              tags: [],
              roles: ['USER'],
              _id: 'user-id',
              userName: 'username',
              name: 'User Name',
              urlName: 'username',
              provider: 'site-provider',
              providerUserId: 'user-id',
              profile: {
                urlName: 'username',
                email: 'user@example.com',
                username: 'username',
                displayName: 'User Name',
                name: {
                  familyName: 'Name',
                  givenName: 'User',
                },
                id: 'user-id',
              },
              joinedAt: '123423423',
              type: 'user',
            },
            token: 'user-token-1234',
            firebaseToken: 'fb-token-1234',
          },
        };
        return Promise.resolve(data);
      });
      // @ts-ignore
      XHRTransport.mockImplementation(() => {
        return {
          post: mockPost,
        };
      });

      const restAPI = new RestAPI();

      const providerUser: ProviderUser = {
        provider: 'my-api-key',
        username: 'test-user',
        profile: {
          email: 'test@test.com',
          username: 'test@test.com',
          displayName: 'New User',
          name: {
            familyName: 'User',
            givenName: 'New',
          },
          profileImage: 'http://www.test.com',
          id: 'new-user-1234',
        },
      };

      const externalUser: ExternalUser = await restAPI.getArenaUser(providerUser);

      expect(externalUser.token).toEqual('user-token-1234');
    });
  });
});
