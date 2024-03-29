import { LiveChat } from '@live-chat/live-chat';
import { GraphQLAPI } from '@services/graphql-api';
import { exampleChatRoom, exampleLiveChatChannel, exampleSite } from '../../fixtures/examples';
import { PublicUser, PublicUserStatus, Status } from '@arena-im/chat-types';
import * as RealtimeAPI from '@services/realtime-api';
import { RestAPI } from '@services/rest-api';
import { Channel } from '@channel/channel';

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: {
    instance: jest.fn(),
  },
}));

jest.mock('@arena-im/core', () => ({
  ArenaHub: {
    getInstance: () => ({
      trackPage: jest.fn(),
    }),
  },
  Credentials: jest.fn(),
  PresenceAPI: {
    getInstance: () => ({
      watchOnlineCount: jest.fn(),
      joinUser: jest.fn().mockResolvedValue(true),
      offAllListeners: jest.fn(),
    }),
  },
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

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@channel/channel', () => ({
  Channel: jest.fn(),
}));

describe('LiveChat', () => {
  beforeEach(() => {
    // @ts-ignore
    RestAPI.getCachedInstance = jest.fn(() => {
      return {
        loadChatRoom: async () => {
          return { chatRoom: exampleChatRoom };
        },
      };
    });
  });

  it('should return a cached instance', async () => {
    // @ts-ignore
    GraphQLAPI.instance = {
      listChannels: async () => {
        return [];
      },
    };

    await LiveChat.getInstance(exampleSite.slug);
    await LiveChat.getInstance(exampleSite.slug);

    await LiveChat.getInstance('new-slug');

    expect(RestAPI.getCachedInstance).toBeCalledTimes(2);
  });

  describe('getChannels()', () => {
    it('should get all live chat channels', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        listChannels: async () => {
          return [];
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const result = await liveChat.getChannels();

      expect(result).toEqual([]);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        listChannels: async () => {
          throw new Error('failed');
        },
      };

      LiveChat.getInstance(exampleSite.slug)
        .then((liveChat) => {
          return liveChat.getChannels();
        })
        .catch((error) => {
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

    it('should get the main channel', async () => {
      // @ts-ignore
      Channel.getInstance = jest.fn(() => {
        return {
          banUser: jest.fn(),
        };
      });

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const channelI = liveChat.getMainChannel();

      expect(typeof channelI.banUser).toEqual('function');
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
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchChannel: async () => {
          return exampleLiveChatChannel;
        },
      };

      // @ts-ignore
      Channel.getInstance = jest.fn(() => {
        return {
          banUser: jest.fn(),
        };
      });

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const channelI = await liveChat.getChannel('fake-main-channel');

      expect(typeof channelI.banUser).toEqual('function');
    });

    it('should return an exception when the channel id is invalid', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchChannel: async () => {
          throw new Error(Status.Invalid);
        },
      };

      // @ts-ignore
      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      try {
        await liveChat.getChannel('fake-main-channel');
      } catch (e: any) {
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

      // @ts-ignore
      GraphQLAPI.instance = {
        fetchMembers: async () => {
          return [user];
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

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

      // @ts-ignore
      GraphQLAPI.instance = {
        fetchMembers: async () => {
          return [user];
        },
      };

      // @ts-ignore
      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const page = {
        first: 25,
      };

      const searchTerm = '';

      const members = await liveChat.getMembers(page, searchTerm);

      expect(members).toEqual([user]);
    });

    it('should receive a error', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchMembers: async () => {
          throw new Error('invalid');
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const page = {
        first: 25,
      };

      const searchTerm = '';

      liveChat.getMembers(page, searchTerm).catch((e) => {
        expect(e.message).toEqual(`Cannot fetch chat members messages on "${exampleChatRoom.slug}" channel.`);
      });
    });
  });

  describe('fetchUserReminderSubscription()', () => {
    it('should fetch a user reminder subscription', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchUserReminderSubscription: async () => {
          return true;
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const isSubscribedToReminder = await liveChat.fetchUserReminderSubscription('fake-reminder-id');

      expect(isSubscribedToReminder).toEqual(true);
    });
    it('should throw error', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchUserReminderSubscription: async () => {
          throw new Error();
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      try {
        await liveChat.fetchUserReminderSubscription('fake-reminder-id');
      } catch (err: any) {
        expect(err.message).toEqual('Cannot fetch user reminder subscription for this reminder: "fake-reminder-id".');
      }
    });
  });
  describe('subscribeUserToReminder()', () => {
    it('should subscribe user to reminder', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        subscribeUserToReminder: async () => {
          return true;
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const subscribeUserToReminder = await liveChat.subscribeUserToReminder('fake-reminder-id', 'fake-url');

      expect(subscribeUserToReminder).toEqual(true);
    });
    it('should throw error', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        subscribeUserToReminder: async () => {
          throw new Error('failed');
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      try {
        await liveChat.subscribeUserToReminder('fake-reminder-id', 'fake-url');
      } catch (err: any) {
        expect(err.message).toEqual('Cannot subscribe user to reminder for this reminder: "fake-reminder-id".');
      }
    });
  });
  describe('unsubscribeUserToReminder()', () => {
    it('should subscribe user to reminder', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        unsubscribeUserToReminder: async () => {
          return true;
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      const unsubscribeUserToReminder = await liveChat.unsubscribeUserToReminder('fake-reminder-id');

      expect(unsubscribeUserToReminder).toEqual(true);
    });
    it('should throw error', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        unsubscribeUserToReminder: async () => {
          throw new Error('failed');
        },
      };

      const liveChat = await LiveChat.getInstance(exampleSite.slug);

      try {
        await liveChat.unsubscribeUserToReminder('fake-reminder-id');
      } catch (err: any) {
        expect(err.message).toEqual('Cannot unsubscribe user to reminder for this reminder: "fake-reminder-id".');
      }
    });
  });
});
