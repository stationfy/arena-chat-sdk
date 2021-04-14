import { LiveChat } from '@live-chat/live-chat';
import * as GraphQLAPI from '@services/graphql-api';
import { ArenaHub } from '@services/arena-hub';
import { exampleChatRoom, exampleLiveChatChannel, exampleSDK, exampleSite } from '../../fixtures/examples';
import { PublicUser, PublicUserStatus, Status } from '@arena-im/chat-types';
import * as RealtimeAPI from '@services/realtime-api';

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: jest.fn(),
}));

jest.mock('@services/arena-hub', () => ({
  ArenaHub: jest.fn(),
}));

jest.mock('../../../src/sdk', () => ({
  ArenaChat: jest.fn(() => ({
    site: {
      _id: 'site-id',
      displayName: 'First Site',
    },
    user: {
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Kristin Mckinney',
      id: '123456',
    },
    restAPI: jest.fn(),
    onUserChanged: jest.fn(),
  })),
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

describe('LiveChat', () => {
  beforeEach(() => {
    // @ts-ignore
    ArenaHub.mockImplementation(() => {
      return {
        track: jest.fn(),
      };
    });
  });
  describe('getChannels()', () => {
    it('should get all live chat channels', async () => {
      const graphQLAPIInstanceMock = {
        listChannels: async () => {
          return [];
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      const result = await liveChat.getChannels();

      expect(result).toEqual([]);
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        listChannels: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      liveChat.getChannels().catch((error) => {
        expect(error.message).toEqual(`Cannot get channels on "${exampleChatRoom.slug}" live chat.`);
        done();
      });
    });
  });

  describe('getMainChannel()', () => {
    beforeEach(() => {
      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return {
          listenToChatConfigChanges: jest.fn(),
        };
      });
    });

    it('should get the main channel', () => {
      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      const channelI = liveChat.getMainChannel();

      expect(typeof channelI.banUser).toEqual('function');
    });

    it('should return an exception when there is no mainChannel property in chat room', () => {
      // @ts-ignore
      const liveChat = new LiveChat({ ...exampleChatRoom, mainChannel: null }, exampleSite, exampleSDK);

      try {
        liveChat.getMainChannel();
      } catch (e) {
        expect(e.message).toEqual('Invalid main channel.');
      }
    });
  });

  describe('getChannel()', () => {
    beforeEach(() => {
      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return {
          listenToChatConfigChanges: jest.fn(),
        };
      });
    });
    it('should get an specific channel', async () => {
      const graphQLAPIInstanceMock = {
        fetchChannel: async () => {
          return exampleLiveChatChannel;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      const channelI = await liveChat.getChannel('fake-main-channel');

      expect(typeof channelI.banUser).toEqual('function');
    });

    it('should return an exception when the channel id is invalid', async () => {
      const graphQLAPIInstanceMock = {
        fetchChannel: async () => {
          throw new Error(Status.Invalid);
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      // @ts-ignore
      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      try {
        await liveChat.getChannel('fake-main-channel');
      } catch (e) {
        expect(e.message).toEqual('Invalid channel (fake-main-channel) id.');
      }
    });
  });

  describe('getMembers()', () => {
    it('should fetch members with an anonymous user', async () => {
      const user: PublicUser = {
        _id: 'fake-user-uid',
        name: 'Kristin Mckinney',
        status: PublicUserStatus.OFFLINE,
        isModerator: false,
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        isBlocked: false,
      };

      const graphQLAPIInstanceMock = {
        fetchMembers: async () => {
          return [user];
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      // @ts-ignore
      const liveChat = new LiveChat(exampleChatRoom, exampleSite, { ...exampleSDK, user: null });

      const page = {
        first: 25,
      };

      const searchTerm = '';

      const members = await liveChat.getMembers(page, searchTerm);

      expect(members).toEqual([user]);
    });

    it('should fetch members with a user', async () => {
      const user: PublicUser = {
        _id: 'fake-user-uid',
        name: 'Kristin Mckinney',
        status: PublicUserStatus.OFFLINE,
        isModerator: false,
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        isBlocked: false,
      };

      const graphQLAPIInstanceMock = {
        fetchMembers: async () => {
          return [user];
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      // @ts-ignore
      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      const page = {
        first: 25,
      };

      const searchTerm = '';

      const members = await liveChat.getMembers(page, searchTerm);

      expect(members).toEqual([user]);
    });

    it('should receive a error', (done) => {
      const graphQLAPIInstanceMock = {
        fetchMembers: async () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const liveChat = new LiveChat(exampleChatRoom, exampleSite, exampleSDK);

      const page = {
        first: 25,
      };

      const searchTerm = '';

      liveChat.getMembers(page, searchTerm).catch((e) => {
        expect(e.message).toEqual(`Cannot fetch chat members messages on "${exampleChatRoom.slug}" channel.`);
        done();
      });
    });
  });
});
