import { RestAPI } from '@services/rest-api';
import { Channel } from '@channel/channel';
import { ChatRoom } from '@models/chat-room';
import { Site } from '@models/site';
import { ArenaChat } from '../../src/sdk';
import { ExternalUser } from '@models/user';
import { PrivateChannel } from '@channel/private-channel';
import { exampleUser, exampleSite, exampleGroupChannel } from '../fixtures/examples';
import { ProviderUser } from '@arena-im/chat-types';

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@channel/channel', () => ({
  Channel: jest.fn(),
}));

jest.mock('@channel/private-channel', () => ({
  PrivateChannel: jest.fn(),
}));

describe('SDK', () => {
  beforeEach(() => {
    // @ts-ignore
    RestAPI.mockImplementation(() => {
      return {
        loadSite: async () => {
          return exampleSite;
        },
      };
    });
  });
  describe('getChannel()', () => {
    const chatRoom: ChatRoom = {
      allowSendGifs: true,
      allowShareUrls: true,
      chatAutoOpen: false,
      chatClosedIsEnabled: false,
      chatPreModerationIsEnabled: false,
      chatPreviewEnabled: true,
      chatRequestModeratorIsEnabled: false,
      createdAt: 1592335254033,
      _id: 'new-chatroom',
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

    const site: Site = {
      _id: 'site-id',
      displayName: 'First Site',
    };
    it('should get a channel', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.resolve({ chatRoom, site });
          },
        };
      });

      // @ts-ignore
      Channel.mockImplementation(() => {
        return {
          sendMessage: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      const nextChannel = await sdk.getChannel('my-channel');

      expect(typeof nextChannel.sendMessage).toEqual('function');
    });

    it('should receive an error when the apiKey or channel is wrong', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.reject('invalid');
          },
        };
      });

      // @ts-ignore
      Channel.mockImplementation(() => {
        return {
          sendMessage: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      try {
        await sdk.getChannel('my-channel');
      } catch (e) {
        expect(e.message).toEqual('Invalid site (my-api-key) or channel (my-channel) slugs.');
      }
    });

    it('should receive an error when there is an internal server error', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.reject('failed');
          },
        };
      });

      // @ts-ignore
      Channel.mockImplementation(() => {
        return {
          sendMessage: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      try {
        await sdk.getChannel('my-channel');
      } catch (e) {
        expect(e.message).toEqual('Internal Server Error. Contact the Arena support team.');
      }
    });
  });
  describe('setUser()', () => {
    it('should set an anonymous user', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          getArenaUser: () => {
            const user: ExternalUser = {
              id: '123456',
              name: 'Kristin Mckinney',
              image: 'https://randomuser.me/api/portraits/women/12.jpg',
              token: 'user-token-1234',
              isModerator: false,
            };
            return Promise.resolve(user);
          },
        };
      });

      const sender: ExternalUser = {
        id: '123456',
        name: 'Kristin Mckinney',
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        isModerator: false,
      };

      const sdk = new ArenaChat('my-api-key');

      const response = await sdk.setUser(sender);

      expect(response).toEqual({ ...sender, token: 'user-token-1234' });
    });
  });

  describe('blockPrivateUser()', () => {
    it('should block a user', async () => {
      const mockBlockPrivateUser = jest.fn();

      mockBlockPrivateUser.mockReturnValue(true);

      PrivateChannel.blockPrivateUser = mockBlockPrivateUser;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.blockPrivateUser('fake-user');

      expect(result).toBe(true);
    });
  });

  describe('unblockPrivateUser()', () => {
    it('should unblock a user', async () => {
      const mockUnblockPrivateUser = jest.fn();

      mockUnblockPrivateUser.mockReturnValue(true);

      PrivateChannel.unblockPrivateUser = mockUnblockPrivateUser;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.unblockPrivateUser('fake-user');

      expect(result).toBe(true);
    });
  });

  describe('getPrivateChannel()', () => {
    it('should get a private channel', async () => {
      const mockGetGroupChannel = jest.fn();

      mockGetGroupChannel.mockReturnValue({});

      PrivateChannel.getGroupChannel = mockGetGroupChannel;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.getPrivateChannel('fake-channel');

      expect(result).toEqual({});
    });
  });

  describe('getUserPrivateChannels()', () => {
    it("should get all the user's private channels", async () => {
      const mockGetUserChannels = jest.fn();

      mockGetUserChannels.mockReturnValue([exampleGroupChannel]);

      PrivateChannel.getUserChannels = mockGetUserChannels;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.getUserPrivateChannels();

      expect(result).toEqual([exampleGroupChannel]);
    });
  });

  describe('createUserPrivateChannel()', () => {
    it('shoudl create a new private channel', async () => {
      const mockCreateUserChannel = jest.fn();

      mockCreateUserChannel.mockReturnValue({});

      PrivateChannel.createUserChannel = mockCreateUserChannel;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.createUserPrivateChannel('fake-user');

      expect(result).toEqual({});
    });
  });
});
