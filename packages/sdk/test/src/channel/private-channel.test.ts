import { PrivateChannel } from '@channel/private-channel';
import { exampleSite, exampleUser, exampleGroupChannel } from '../../fixtures/examples';
import * as GraphQLAPI from '@services/graphql-api';
import * as RealtimeAPI from '@services/realtime-api';
import { ExternalUser, ChatMessage } from '@arena-im/chat-types';

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: jest.fn(),
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

describe('PrivateChannel', () => {
  describe('getGroupChannel()', () => {
    it('should get a group channel', async () => {
      const graphQLAPIInstanceMock = {
        fetchGroupChannel: async (id: string) => {
          return { ...exampleGroupChannel, _id: id };
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const groupChannel = await PrivateChannel.getGroupChannel(exampleSite, exampleUser, 'fake-group-channel');

      expect(groupChannel._id).toEqual('fake-group-channel');
    });

    it('should return an exception', async (done) => {
      const graphQLAPIInstanceMock = {
        fetchGroupChannel: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      PrivateChannel.getGroupChannel(exampleSite, exampleUser, 'fake-group-channel').catch((error) => {
        expect(error.message).toEqual('Cannot get the "fake-group-channel" group channel.');
        done();
      });
    });
  });

  describe('unblockPrivateUser()', () => {
    it('should unblock a private user', async () => {
      const graphQLAPIInstanceMock = {
        unblockPrivateUser: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const result = await PrivateChannel.unblockPrivateUser(exampleUser, exampleSite, 'fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', async (done) => {
      const graphQLAPIInstanceMock = {
        unblockPrivateUser: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      PrivateChannel.unblockPrivateUser(exampleUser, exampleSite, 'fake-user').catch((error) => {
        expect(error.message).toEqual('Cannot unblock the user: "fake-user".');
        done();
      });
    });
  });

  describe('blockPrivateUser()', () => {
    it('should block a private user', async () => {
      const graphQLAPIInstanceMock = {
        blockPrivateUser: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const result = await PrivateChannel.blockPrivateUser(exampleUser, exampleSite, 'fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', async (done) => {
      const graphQLAPIInstanceMock = {
        blockPrivateUser: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      PrivateChannel.blockPrivateUser(exampleUser, exampleSite, 'fake-user').catch((error) => {
        expect(error.message).toEqual('Cannot block the user: "fake-user".');
        done();
      });
    });
  });

  describe('getUserChannels()', () => {
    it('should block a private user', async () => {
      const graphQLAPIInstanceMock = {
        fetchGroupChannels: async () => {
          return [exampleGroupChannel];
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const groupChannels = await PrivateChannel.getUserChannels(exampleUser, exampleSite);

      expect(groupChannels).toEqual([exampleGroupChannel]);
    });

    it('should return an exception', async (done) => {
      const graphQLAPIInstanceMock = {
        fetchGroupChannels: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      PrivateChannel.getUserChannels(exampleUser, exampleSite).catch((error) => {
        expect(error.message).toEqual(`Cannot the channels for the user: "${exampleUser.id}".`);
        done();
      });
    });
  });

  describe('onUnreadMessagesCountChanged()', () => {
    it('should receive the unread messages count', (done) => {
      const graphQLAPIInstanceMock = {
        fetchGroupChannelTotalUnreadCount: async () => {
          return 10;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const realtimeAPIInstanceMock = {
        listenToUserGroupChannels: (_: ExternalUser, callback: () => void) => {
          callback();
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      PrivateChannel.onUnreadMessagesCountChanged(exampleUser, exampleSite, (total) => {
        expect(total).toBe(10);
        done();
      });
    });

    it('should return an exception on realtime fail', async () => {
      const graphQLAPIInstanceMock = {
        fetchGroupChannelTotalUnreadCount: async () => {
          return 10;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

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
        PrivateChannel.onUnreadMessagesCountChanged(exampleUser, exampleSite, () => {});
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch unread messages count for the user: "${exampleUser.id}".`);
      }
    });
  });

  describe('createUserChannel()', () => {
    it('should create a private user channel', async () => {
      const graphQLAPIInstanceMock = {
        createGroupChannel: async () => {
          return exampleGroupChannel;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = await PrivateChannel.createUserChannel({
        user: exampleUser,
        userId: 'fake-user',
        site: exampleSite,
      });

      expect(typeof privateChannel.sendMessage).toEqual('function');
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        createGroupChannel: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      PrivateChannel.createUserChannel({
        user: exampleUser,
        userId: 'fake-user',
        site: exampleSite,
      }).catch((e) => {
        expect(e.message).toEqual('Cannot create a channel for with this user: "fake-user".');
        done();
      });
    });
  });

  describe('markRead()', () => {
    it('should mark all message as read', async () => {
      const graphQLAPIInstanceMock = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const result = await privateChannel.markRead();

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        markGroupChannelRead: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.markRead().catch((e) => {
        expect(e.message).toBe('Cannot set group channel read.');
        done();
      });
    });
  });

  describe('deleteMessage()', () => {
    it('should delete a private message', async () => {
      const graphQLAPIInstanceMock = {
        deletePrivateMessage: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const result = await privateChannel.deleteMessage('fake-message');

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        deletePrivateMessage: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.deleteMessage('fake-message').catch((e) => {
        expect(e.message).toBe('Cannot delete this message: "fake-message".');
        done();
      });
    });
  });

  describe('removeAllMessages()', () => {
    it('should remove all messages', async () => {
      const graphQLAPIInstanceMock = {
        removeGroupChannel: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const result = await privateChannel.removeAllMessages();

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        removeGroupChannel: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.removeAllMessages().catch((e) => {
        expect(e.message).toBe(`Cannot remove all messages for this user: "${exampleUser.id}".`);
        done();
      });
    });
  });

  describe('sendMessage()', () => {
    it('should send message on a channel', async () => {
      const graphQLAPIInstanceMock = {
        sendPrivateMessage: async () => {
          return 'fake-message';
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const sentMessageId = await privateChannel.sendMessage({ text: 'hey!' });

      expect(sentMessageId).toEqual('fake-message');
    });

    it('should receive an error when try to send a message', (done) => {
      const graphQLAPIInstanceMock = {
        sendPrivateMessage: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.sendMessage({ text: 'hey!' }).catch((e) => {
        expect(e.message).toBe('Cannot send this message: "hey!". Contact the Arena support team.');
        done();
      });
    });

    it('should receive an error when try to send an empty message', async () => {
      const graphQLAPIInstanceMock = {
        sendPrivateMessage: async () => {
          return 'fake-message';
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.sendMessage({ text: '' }).catch((e) => {
        expect(e.message).toBe('Cannot send an empty message.');
      });
    });
  });

  describe('loadRecentMessages()', () => {
    it('should load recent messages empty', async () => {
      const graphQLAPIInstanceMock = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const realtimeAPIInstanceMock = {
        fetchGroupRecentMessages: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const messages = await privateChannel.loadRecentMessages(10);

      expect(messages).toEqual([]);
    });

    it('should load 5 recent messages', async () => {
      const graphQLAPIInstanceMock = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const realtimeAPIInstanceMock = {
        fetchGroupRecentMessages: () => {
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

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const messages = await privateChannel.loadRecentMessages(10);

      expect(messages.length).toEqual(5);
    });

    it('should receive an error', (done) => {
      const graphQLAPIInstanceMock = {
        markGroupChannelRead: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const realtimeAPIInstanceMock = {
        fetchGroupRecentMessages: () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.loadRecentMessages(10).catch((e) => {
        expect(e.message).toEqual(`Cannot load messages on "${exampleGroupChannel._id}" channel.`);
        done();
      });
    });
  });

  describe('loadPreviousMessages()', () => {
    it('should load 5 previous message', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        fetchGroupRecentMessages: () => {
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

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.loadPreviousMessages(5).catch((e) => {
        expect(e.message).toBe('You should call the loadRecentMessages method first.');
        done();
      });
    });

    it('should load 0 previous message', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        fetchGroupRecentMessages: () => {
          return Promise.resolve([]);
        },
        fetchGroupPreviousMessages: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      const spy = jest.spyOn(privateChannel, 'markRead');

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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      try {
        privateChannel.onMessageReceived((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      try {
        privateChannel.onMessageDeleted((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const privateChannel = new PrivateChannel(exampleGroupChannel, exampleSite, exampleUser);

      privateChannel.onMessageModified((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        expect(message.changeType).toEqual('modified');
        done();
      });
    });
  });
});
