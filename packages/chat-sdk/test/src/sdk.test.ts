import { RestAPI } from '@services/rest-api';
import { Channel } from '@channel/channel';
import { ArenaChat } from '../../src/sdk';
import { PrivateChannel } from '@channel/private-channel';
import { exampleUser, exampleSite, exampleGroupChannel } from '../fixtures/examples';
import { ExternalUser } from '@arena-im/chat-types';
import { LiveChat } from '@live-chat/live-chat';
import { OrganizationSite, User } from '@arena-im/core';

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@channel/channel', () => ({
  Channel: jest.fn(),
}));

jest.mock('@live-chat/live-chat', () => ({
  LiveChat: jest.fn(),
}));

jest.mock('@qna/qna', () => ({
  Qna: jest.fn(),
}));

jest.mock('@channel/private-channel', () => ({
  PrivateChannel: jest.fn(),
}));

jest.mock('@arena-im/core', () => ({
  OrganizationSite: {
    instance: jest.fn(),
    getInstance: jest.fn(),
  },
  User: {
    instance: {
      data: jest.fn(),
    },
  },
  Credentials: jest.fn(),
}));

describe('SDK', () => {
  beforeEach(() => {
    const mockAPIInstance = jest.fn();

    mockAPIInstance.mockReturnValue({
      loadSite: async () => {
        return exampleSite;
      },
    });

    RestAPI.getCachedInstance = mockAPIInstance;
  });

  describe('getLiveChat()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      User.instance.unsetUser = jest.fn(() => {
        User.instance.data = exampleUser;
      });

      // @ts-ignore
      User.instance.setNewUser = jest.fn((user) => {
        User.instance.data = { ...user, token: 'user-token-1234' };

        return User.instance.data;
      });

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });
    it('should get a live chat', async () => {
      // @ts-ignore
      LiveChat.getInstance = jest.fn(() => {
        return {
          getChannels: async () => {
            return true;
          },
        };
      });

      const sdk = new ArenaChat('my-api-key');

      const liveChatI = await sdk.getLiveChat('fake-chat');

      expect(typeof liveChatI.getChannels).toEqual('function');
    });

    it('should receive an error when there is an internal server error', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        loadChatRoom: () => {
          return Promise.reject('failed');
        },
      });

      RestAPI.getCachedInstance = mockAPIInstance;

      // @ts-ignore
      Channel.mockImplementation(() => {
        return {
          sendMessage: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      try {
        await sdk.getLiveChat('my-channel');
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual('Internal Server Error. Contact the Arena support team.');
      }
    });
  });
  describe('setUser()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      User.instance.unsetUser = jest.fn(() => {
        User.instance.data = exampleUser;
      });

      // @ts-ignore
      User.instance.setNewUser = jest.fn((user) => {
        User.instance.data = { ...user, token: 'user-token-1234' };

        return User.instance.data;
      });

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });

    it('should set an anonymous user', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
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
      });

      RestAPI.getAPIInstance = mockAPIInstance;

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

    it('should unset the current user', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
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
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      const sdk = new ArenaChat('my-api-key');

      const response = await sdk.setUser(null);

      expect(response).toEqual(null);
    });
  });

  describe('blockPrivateUser()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });

    it('should block a user', async () => {
      const mockBlockPrivateUser = jest.fn();

      mockBlockPrivateUser.mockReturnValue(true);

      PrivateChannel.blockPrivateUser = mockBlockPrivateUser;

      const sdk = new ArenaChat('my-api-key');

      const result = await sdk.blockPrivateUser('fake-user');

      expect(result).toBe(true);
    });

    it('should return an error if there is no current user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const sdk = new ArenaChat('my-api-key');

      sdk.blockPrivateUser('fake-user').catch((error) => {
        expect(error.message).toBe('Cannot block a user without a current user.');
        done();
      });
    });
  });

  describe('unblockPrivateUser()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });

    it('should unblock a user', async () => {
      const mockUnblockPrivateUser = jest.fn();

      mockUnblockPrivateUser.mockReturnValue(true);

      PrivateChannel.unblockPrivateUser = mockUnblockPrivateUser;

      const sdk = new ArenaChat('my-api-key');

      const result = await sdk.unblockPrivateUser('fake-user');

      expect(result).toBe(true);
    });

    it('should return an error if there is no current user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const sdk = new ArenaChat('my-api-key');

      sdk.unblockPrivateUser('fake-user').catch((error) => {
        expect(error.message).toBe('Cannot unblock a user without a current user.');
        done();
      });
    });
  });

  describe('getPrivateChannel()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });

    it('should get a private channel', async () => {
      const mockGetGroupChannel = jest.fn();

      mockGetGroupChannel.mockReturnValue({});

      PrivateChannel.getGroupChannel = mockGetGroupChannel;

      const sdk = new ArenaChat('my-api-key');

      const result = await sdk.getPrivateChannel('fake-channel');

      expect(result).toEqual({});
    });

    it('should return an error if there is no current user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const sdk = new ArenaChat('my-api-key');

      sdk.getPrivateChannel('fake-channel').catch((error) => {
        expect(error.message).toBe('Cannot get a private channel without a current user.');
        done();
      });
    });
  });

  describe('getUserPrivateChannels()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });

    it("should get all the user's private channels", async () => {
      const mockGetUserChannels = jest.fn();

      mockGetUserChannels.mockReturnValue([exampleGroupChannel]);

      PrivateChannel.getUserChannels = mockGetUserChannels;

      const sdk = new ArenaChat('my-api-key');

      const result = await sdk.getUserPrivateChannels();

      expect(result).toEqual([exampleGroupChannel]);
    });

    it('should return an error if there is no current user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const sdk = new ArenaChat('my-api-key');

      sdk.getUserPrivateChannels().catch((error) => {
        expect(error.message).toBe('Cannot get the list of private channels without a current user.');
        done();
      });
    });
  });

  describe('createUserPrivateChannel()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });
    it('should create a new private channel', async () => {
      const mockCreateUserChannel = jest.fn();

      mockCreateUserChannel.mockReturnValue({});

      PrivateChannel.createUserChannel = mockCreateUserChannel;

      const sdk = new ArenaChat('my-api-key');

      const result = await sdk.createUserPrivateChannel('fake-user');

      expect(result).toEqual({});
    });

    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      // @ts-ignore
      User.instance.data = null;

      sdk.createUserPrivateChannel('fake-user').catch((error) => {
        expect(error.message).toBe('Cannot create a private channel without a current user.');
        done();
      });
    });
  });

  describe('onUnreadPrivateMessagesCountChanged()', () => {
    beforeAll(() => {
      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });
    it('should return an error if there is no current user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const sdk = new ArenaChat('my-api-key');

      sdk
        .onUnreadPrivateMessagesCountChanged((total: number) => {
          console.log({ total });
        })
        .catch((error) => {
          expect(error.message).toBe('Cannot listen to unread private messages without a current user.');
          done();
        });
    });

    it('should call the unread messages from the private chat', async () => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      PrivateChannel.onUnreadMessagesCountChanged = jest.fn();

      const sdk = new ArenaChat('my-api-key');

      const spy = jest.spyOn(PrivateChannel, 'onUnreadMessagesCountChanged');

      const callback = (total: number) => {
        console.log({ total });
      };

      await sdk.onUnreadPrivateMessagesCountChanged(callback);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(callback);
    });
  });

  describe('offUnreadMessagesCountChanged()', () => {
    beforeAll(() => {
      // @ts-ignore
      User.instance.data = exampleUser;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      User.instance.onUserChanged = jest.fn(() => {});

      // @ts-ignore
      OrganizationSite.getInstance = jest.fn(() => {
        return {
          getSite: jest.fn(async () => exampleSite),
        };
      });

      // @ts-ignore
      OrganizationSite.instance.getSite = jest.fn(async () => exampleSite);
    });
    it('should turn off the unread messages listener', (done) => {
      const mockListener = jest.fn();
      mockListener.mockReturnValue(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      });

      PrivateChannel.onUnreadMessagesCountChanged = mockListener;

      const sdk = new ArenaChat('my-api-key');

      sdk
        .onUnreadPrivateMessagesCountChanged((total: number) => {
          console.log({ total });
        })
        .then(() => {
          sdk.offUnreadMessagesCountChanged((result) => {
            expect(result).toBe(true);
            done();
          });
        });
    });

    it('should not turn off the unread messages without a listener', (done) => {
      const mockListener = jest.fn();
      mockListener.mockReturnValue(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      });

      PrivateChannel.onUnreadMessagesCountChanged = mockListener;

      const sdk = new ArenaChat('my-api-key');

      sdk.offUnreadMessagesCountChanged((result) => {
        expect(result).toBe(false);
        done();
      });
    });
  });
});
