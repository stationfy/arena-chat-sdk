import { RestAPI } from '@services/rest-api';
import { Channel } from '@channel/channel';
import { ChatRoom } from '@models/chat-room';
import { Site } from '@models/site';
import { ArenaChat } from '../../src/sdk';
import { ExternalUser } from '@models/user';

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@channel/channel', () => ({
  Channel: jest.fn(),
}));

describe('SDK', () => {
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
            return Promise.resolve('user-token-1234');
          },
        };
      });

      const sender: ExternalUser = {
        id: '123456',
        name: 'Kristin Mckinney',
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
      };

      const sdk = new ArenaChat('my-api-key');

      const response = await sdk.setUser(sender);

      expect(response).toEqual({ ...sender, token: 'user-token-1234' });
    });
  });
});
