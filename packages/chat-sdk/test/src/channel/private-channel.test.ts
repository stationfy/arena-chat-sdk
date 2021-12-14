import { PrivateChannel } from '@channel/private-channel';
import { User, OrganizationSite } from '@arena-im/core';
import { exampleUser, exampleGroupChannel, exampleSite } from '../../fixtures/examples';
import { GraphQLAPI } from '@services/graphql-api';
import * as RealtimeAPI from '@services/realtime-api';
import { ExternalUser, ChatMessage } from '@arena-im/chat-types';

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: {
    instance: jest.fn(),
  },
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

jest.mock('@arena-im/core', () => ({
  User: {
    instance: {
      data: jest.fn(),
    },
  },
  OrganizationSite: {
    instance: {
      getSite: jest.fn(),
    },
  },
}));

describe('PrivateChannel', () => {
  describe('getGroupChannel()', () => {
    it('should get a group channel', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchGroupChannel: async (id: string) => {
          return { ...exampleGroupChannel, _id: id };
        },
      };

      const groupChannel = await PrivateChannel.getGroupChannel('fake-group-channel');

      expect(groupChannel._id).toEqual('fake-group-channel');
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchGroupChannel: async () => {
          throw new Error('failed');
        },
      };

      PrivateChannel.getGroupChannel('fake-group-channel').catch((error) => {
        expect(error.message).toEqual('Cannot get the "fake-group-channel" group channel.');
        done();
      });
    });
  });

  describe('unblockPrivateUser()', () => {
    it('should unblock a private user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        unblockPrivateUser: async () => {
          return true;
        },
      };

      const result = await PrivateChannel.unblockPrivateUser('fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        unblockPrivateUser: async () => {
          throw new Error('failed');
        },
      };

      PrivateChannel.unblockPrivateUser('fake-user').catch((error) => {
        expect(error.message).toEqual('Cannot unblock the user: "fake-user".');
        done();
      });
    });
  });

  describe('blockPrivateUser()', () => {
    it('should block a private user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        blockPrivateUser: async () => {
          return true;
        },
      };

      const result = await PrivateChannel.blockPrivateUser('fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        blockPrivateUser: async () => {
          throw new Error('failed');
        },
      };

      PrivateChannel.blockPrivateUser('fake-user').catch((error) => {
        expect(error.message).toEqual('Cannot block the user: "fake-user".');
        done();
      });
    });
  });

  describe('getUserChannels()', () => {
    it('should block a private user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchGroupChannels: async () => {
          return [exampleGroupChannel];
        },
      };

      const groupChannels = await PrivateChannel.getUserChannels();

      expect(groupChannels).toEqual([exampleGroupChannel]);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchGroupChannels: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      User.instance.data = exampleUser;

      PrivateChannel.getUserChannels().catch((error) => {
        expect(error.message).toEqual(`Cannot the channels for the user: "${exampleUser.id}".`);
        done();
      });
    });
  });

  describe('onUnreadMessagesCountChanged()', () => {
    it('should receive the unread messages count', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchGroupChannelTotalUnreadCount: async () => {
          return 10;
        },
      };

      const realtimeAPIInstanceMock = {
        listenToUserGroupChannels: (_: ExternalUser, callback: () => void) => {
          callback();
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      PrivateChannel.onUnreadMessagesCountChanged((total) => {
        expect(total).toBe(10);
        done();
      });
    });

    it('should return an exception on realtime fail', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchGroupChannelTotalUnreadCount: async () => {
          return 10;
        },
      };

      // @ts-ignore
      User.instance.data = exampleUser;

      const realtimeAPIInstanceMock = {
        listenToUserGroupChannels: () => {
          throw new Error('faild');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      try {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        PrivateChannel.onUnreadMessagesCountChanged(() => {});
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual(`Cannot watch unread messages count for the user: "${exampleUser.id}".`);
      }
    });
  });

  describe('createUserChannel()', () => {
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
    it('should create a private user channel', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        createGroupChannel: async () => {
          return exampleGroupChannel;
        },
      };

      // @ts-ignore
      User.instance.data = exampleUser;

      const privateChannel = await PrivateChannel.createUserChannel({
        userId: 'fake-user',
      });

      expect(typeof privateChannel.sendMessage).toEqual('function');
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        createGroupChannel: async () => {
          throw new Error('failed');
        },
      };

      PrivateChannel.createUserChannel({
        userId: 'fake-user',
      }).catch((e) => {
        expect(e.message).toEqual('Cannot create a channel for with this user: "fake-user".');
        done();
      });
    });
  });

  describe('markRead()', () => {
    it('should mark all message as read', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const result = await privateChannel.markRead();

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        markGroupChannelRead: async () => {
          throw new Error('failed');
        },
      };

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.markRead().catch((e) => {
        expect(e.message).toBe('Cannot set group channel read.');
        done();
      });
    });
  });

  describe('deleteMessage()', () => {
    it('should delete a private message', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deletePrivateMessage: async () => {
          return true;
        },
      };

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const result = await privateChannel.deleteMessage('fake-message');

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deletePrivateMessage: async () => {
          throw new Error('failed');
        },
      };

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.deleteMessage('fake-message').catch((e) => {
        expect(e.message).toBe('Cannot delete this message: "fake-message".');
        done();
      });
    });
  });

  describe('removeAllMessages()', () => {
    it('should remove all messages', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        removeGroupChannel: async () => {
          return true;
        },
      };

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const result = await privateChannel.removeAllMessages();

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        removeGroupChannel: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      User.instance.data = exampleUser;

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.removeAllMessages().catch((e) => {
        expect(e.message).toBe(`Cannot remove all messages for this user: "${exampleUser.id}".`);
        done();
      });
    });
  });

  describe('sendMessage()', () => {
    it('should send message on a channel', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        sendPrivateMessage: async () => {
          return 'fake-message';
        },
      };

      const realtimeAPIInstanceMock = {
        fetchGroupRecentMessages: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      OrganizationSite.instance.getSite = jest.fn().mockReturnValue(exampleSite);

      // @ts-ignore
      User.instance.data = exampleUser;

      const sentMessageId = await privateChannel.sendMessage({ text: 'hey!' });

      expect(sentMessageId).toEqual('fake-message');
    });

    it('should receive an error when try to send a message', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        sendPrivateMessage: async () => {
          throw new Error('failed');
        },
      };

      const realtimeAPIInstanceMock = {
        fetchGroupRecentMessages: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.sendMessage({ text: 'hey!' }).catch((e) => {
        expect(e.message).toBe('Cannot send this message: "hey!". Contact the Arena support team.');
        done();
      });
    });

    it('should receive an error when try to send an empty message', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        sendPrivateMessage: async () => {
          return 'fake-message';
        },
      };

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.sendMessage({ text: '' }).catch((e) => {
        expect(e.message).toBe('Cannot send an empty message.');
      });
    });
  });

  describe('loadRecentMessages()', () => {
    it('should load recent messages empty', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (
          _channelId: string,
          _callback: () => void,
          callback: (message: ChatMessage[]) => void,
        ) => {
          callback([]);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const messages = await privateChannel.loadRecentMessages(10);

      expect(messages).toEqual([]);
    });

    it('should load 5 recent messages', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (
          _channelId: string,
          _callback: () => void,
          callback: (message: ChatMessage[]) => void,
        ) => {
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

          const messages: ChatMessage[] = new Array(5).fill(message);

          callback(messages);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const messages = await privateChannel.loadRecentMessages(10);

      expect(messages.length).toEqual(5);
    });

    it('should receive an error', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      const realtimeAPIInstanceMock = {
        fetchGroupRecentMessages: () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.loadRecentMessages(10).catch((e) => {
        expect(e.message).toEqual(`Cannot load messages on "${exampleGroupChannel._id}" channel.`);
        done();
      });
    });
  });

  describe('loadPreviousMessages()', () => {
    it('should load 5 previous message', async () => {
      // const realtimeAPIInstanceMock = {
      //   listenToChatConfigChanges: jest.fn(),
      //   fetchGroupRecentMessages: () => {
      //     const message: ChatMessage = {
      //       createdAt: 1592342151026,
      //       key: 'fake-key',
      //       message: {
      //         text: 'testing',
      //       },
      //       publisherId: 'site-id',
      //       sender: {
      //         displayName: 'Test User',
      //         photoURL: 'http://www.google.com',
      //       },
      //     };

      //     const messages: ChatMessage[] = new Array(5).fill(message);

      //     return Promise.resolve(messages);
      //   },
      //   fetchGroupPreviousMessages: () => {
      //     const message: ChatMessage = {
      //       createdAt: 1592342151026,
      //       key: 'fake-key',
      //       message: {
      //         text: 'testing',
      //       },
      //       publisherId: 'site-id',
      //       sender: {
      //         displayName: 'Test User',
      //         photoURL: 'http://www.google.com',
      //       },
      //     };

      //     const messages: ChatMessage[] = new Array(5).fill(message);

      //     return Promise.resolve(messages);
      //   },
      // };

      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToGroupMessageReceived: (
          _channelId: string,
          _callback: () => void,
          callback: (message: ChatMessage[]) => void,
        ) => {
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

          const messages: ChatMessage[] = new Array(5).fill(message);

          callback(messages);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      await privateChannel.loadRecentMessages(5);

      const messages = await privateChannel.loadPreviousMessages(5);

      expect(messages.length).toEqual(5);
    });
    it('should receive an error when try to get previous message without call recent messages first', (done) => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        fetchGroupPreviousMessages: () => {
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

          const messages: ChatMessage[] = new Array(5).fill(message);

          return Promise.resolve(messages);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.loadPreviousMessages(5).catch((e) => {
        expect(e.message).toBe('You should call the loadRecentMessages method first.');
        done();
      });
    });

    it('should load 0 previous message', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToGroupMessageReceived: (
          _channelId: string,
          _callback: () => void,
          callback: (message: ChatMessage[]) => void,
        ) => {
          callback([]);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      await privateChannel.loadRecentMessages(5);

      const messages = await privateChannel.loadPreviousMessages(5);

      expect(messages.length).toEqual(0);
    });
  });

  describe('offMessageReceived()', () => {
    it('should stop listening message received', () => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'added',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      privateChannel.onMessageReceived(() => {});
      privateChannel.offMessageReceived();
    });
  });

  describe('onMessageReceived()', () => {
    beforeEach(() => {
      jest.resetAllMocks();
    });
    it('should receive a message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'added',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.onMessageReceived((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        done();
      });
    });

    it('should call markRead method for other users message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'added',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              uid: 'other-user-id',
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const spy = jest.spyOn(privateChannel, 'markRead');

      // @ts-ignore
      User.instance.data = exampleUser;

      privateChannel.onMessageReceived(() => {
        expect(spy).toBeCalledTimes(1);
        done();
      });
    });

    it('should not call markRead method for current user message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'added',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              _id: exampleUser.id,
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      // @ts-ignore
      User.instance.data = exampleUser;

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      const spy = jest.spyOn(privateChannel, 'markRead');

      privateChannel.onMessageReceived(() => {
        expect(spy).toBeCalledTimes(0);
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      try {
        privateChannel.onMessageReceived((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual(`Cannot watch new messages on "${exampleGroupChannel._id}" channel.`);
      }
    });
  });

  describe('offMessageDeleted()', () => {
    it('should receive a message deleted', () => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'removed',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      privateChannel.onMessageDeleted(() => {});
      privateChannel.offMessageDeleted();
    });
  });

  describe('onMessageDeleted()', () => {
    it('should receive a message deleted', (done) => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'removed',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.onMessageDeleted((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        expect(message.changeType).toEqual('removed');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      try {
        privateChannel.onMessageDeleted((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual(`Cannot watch deleted messages on "${exampleGroupChannel._id}" channel.`);
      }
    });
  });

  describe('offMessageModified()', () => {
    it('should stop listening message modified', () => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'modified',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleMessageModified = () => {};

      privateChannel.onMessageModified(handleMessageModified);

      privateChannel.offMessageModified();
    });
  });

  describe('onMessageModified()', () => {
    it('should receive a message modified', (done) => {
      const realtimeAPIInstanceMock = {
        listenToGroupMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-key',
            changeType: 'modified',
            message: {
              text: 'testing',
            },
            publisherId: 'site-id',
            sender: {
              displayName: 'Test User',
              photoURL: 'http://www.google.com',
            },
          };

          callback(message);

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel);

      privateChannel.onMessageModified((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        expect(message.changeType).toEqual('modified');
        done();
      });
    });
  });
});
