import { Channel } from '@channel/channel';
import { User, OrganizationSite, ArenaHub } from '@arena-im/core';
import { ChatRoom, Moderation, ModeratorStatus, MessageReaction, ChatMessageSender } from '@arena-im/chat-types';
import { Site } from '@arena-im/chat-types';

import { GraphQLAPI } from '@services/graphql-api';
import { RestAPI } from '@services/rest-api';
import { ChatMessage } from '@arena-im/chat-types';
import * as RealtimeAPI from '@services/realtime-api';
import {
  exampleChatMessage,
  exampleChatRoom,
  exampleLiveChatChannel,
  exampleSite,
  exampleUser,
} from '../../fixtures/examples';

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: {
    instance: jest.fn(),
  },
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

const createReactionSpy = jest.fn();

const reactionsAPIMock = {
  fetchUserReactions: () => [],
  fetchChannelReactions: () => [],
  watchUserReactions: jest.fn(),
  watchChannelReactions: jest.fn(),
  createReaction: createReactionSpy,
  removeReaction: () => Promise.resolve([]),
};

jest.mock('@arena-im/core', () => ({
  ArenaHub: jest.fn(),
  User: {
    instance: {
      data: jest.fn(),
    },
  },
  OrganizationSite: {
    instance: jest.fn(),
  },
  UserObservable: {
    instance: {
      onUserChanged: jest.fn(),
    },
  },
  PresenceAPI: {
    getInstance: () => ({
      watchOnlineCount: jest.fn(),
      joinUser: jest.fn().mockResolvedValue(true),
      offAllListeners: jest.fn(),
    }),
  },
  ReactionsAPIWS: {
    getInstance: () => reactionsAPIMock,
  },
  ReactionsAPIFirestore: {
    getInstance: () => reactionsAPIMock,
  },
  LocalStorageAPI: {},
}));

describe('Channel', () => {
  beforeEach(() => {
    jest.resetAllMocks();

    // @ts-ignore
    User.instance.data = exampleUser;

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    User.instance.onUserChanged = jest.fn(() => {});

    // @ts-ignore
    OrganizationSite.instance.getSite = jest.fn(() => exampleSite);

    // @ts-ignore
    ArenaHub.getInstance = jest.fn(() => ({
      track: jest.fn(),
      trackPage: jest.fn(),
    }));

    // @ts-ignore
    RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
      return {
        listenToChatConfigChanges: jest.fn(),
      };
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

  describe('banUser()', () => {
    it('should ban a user', (done) => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        banUser: () => {
          return Promise.resolve();
        },
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return {
          listenToChatConfigChanges: jest.fn(),
        };
      });

      const user: ChatMessageSender = {
        photoURL: 'https://www.google.com',
        displayName: 'Ban User',
        uid: 'test-ban-user-id',
      };

      channel.banUser(user).then(done);
    });

    it('should receive an error when ban a user', (done) => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        banUser: () => {
          return Promise.reject('failed');
        },
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const user: ChatMessageSender = {
        photoURL: 'https://www.google.com',
        displayName: 'Ban User',
        uid: 'test-ban-user-id',
      };

      channel.banUser(user).catch((e) => {
        expect(e.message).toBe('Cannot ban this user: "test-ban-user-id". Contact the Arena support team.');
        done();
      });
    });
  });

  describe('requestModeration()', () => {
    it('should request moderation for a user', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        requestModeration: async (site: Site, chatRoom: ChatRoom) => {
          const moderation: Moderation = {
            label: 'Mod',
            _id: 'fake-moderation-id',
            siteId: site._id,
            chatRoomId: chatRoom._id,
            userId: '123456',
            status: ModeratorStatus.PENDING,
          };

          return moderation;
        },
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const moderation = await channel.requestModeration();

      expect(moderation.chatRoomId).toBe('new-chatroom');
      expect(moderation.siteId).toBe('site-id');
      expect(moderation.userId).toBe('123456');
      expect(moderation.status).toEqual('PENDING');
    });

    it('should receive an error when request moderation', (done) => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        requestModeration: () => {
          return Promise.reject('failed');
        },
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      channel.requestModeration().catch((e) => {
        expect(e.message).toBe(
          `Cannot request moderation for user: "${exampleUser.id}". Contact the Arena support team.`,
        );
        done();
      });
    });
  });

  describe('deleteMessage()', () => {
    it('should delete a message by a moderator', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deleteOpenChannelMessage: async () => {
          return true;
        },
      };

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

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

      const result = await channel.deleteMessage(message);

      expect(result).toEqual(true);
    });

    it('should receive an error when delete a message', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deleteOpenChannelMessage: async () => {
          return Promise.reject('failed');
        },
      };

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

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

      channel.deleteMessage(message).catch((e) => {
        expect(e.message).toBe(`Cannot delete this message: "${message.key}". Contact the Arena support team.`);
        done();
      });
    });
  });

  describe('sendMessage()', () => {
    it('should send message on a channel', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        sendMessaToChannel: async () => {
          return exampleChatMessage.key;
        },
      };

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const sentMessage = await channel.sendMessage({ text: 'hey!' });

      expect(sentMessage).toEqual(exampleChatMessage.key);
    });

    it('should receive an error when try to send a message', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        sendMessaToChannel: async () => {
          return Promise.reject('failed');
        },
      };

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        await channel.sendMessage({ text: 'hey!' });
      } catch (e: any) {
        expect(e.message).toBe('Cannot send this message: "hey!". Contact the Arena support team.');
      }
    });

    it('should receive an error when try to send an empty message', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        sendMessage: (_: ChatRoom, chatMessage: ChatMessage) => {
          chatMessage.key = 'new-message-key';
          return Promise.resolve(chatMessage);
        },
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        const message = await channel.sendMessage({ text: '' });
        expect(message).toEqual(null);
      } catch (e: any) {
        expect(e.message).toBe('Cannot send an empty message.');
      }
    });
  });

  describe('sendMonetizationMessage()', () => {
    it('should send message on a channel', async () => {
      const graphQLAPIInstanceMock = {
        sendMonetizationMessageToChannel: async () => {
          return exampleChatMessage.key;
        },
      };

      // @ts-ignore
      GraphQLAPI.instance = graphQLAPIInstanceMock;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const sentMessage = await channel.sendMonetizationMessage({ text: 'donated' });

      expect(sentMessage).toEqual(exampleChatMessage.key);
    });

    it('should receive an error when try to send a message', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        sendMonetizationMessageToChannel: async () => {
          return Promise.reject('failed');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return {
          listenToChatConfigChanges: jest.fn(),
        };
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        await channel.sendMonetizationMessage({ text: 'donated' });
      } catch (e: any) {
        expect(e.message).toBe('Cannot send this message: "donated". Contact the Arena support team.');
      }
    });
  });

  it.skip('should create an instance of realtime api with chatroom id', () => {
    const spy = jest.spyOn(RealtimeAPI.RealtimeAPI, 'getInstance');

    Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith();
  });

  describe('loadRecentMessages()', () => {
    it('should load recent messages empty', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (
          _: string,
          _callback: (message: ChatMessage) => void,
          callback: (messages: ChatMessage[]) => void,
        ) => {
          callback([]);

          return null;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const messages = await channel.loadRecentMessages(10);

      expect(messages).toEqual([]);
    });

    it('should load 5 recent messages', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (
          _: string,
          _callback: (message: ChatMessage) => void,
          callback: (messages: ChatMessage[]) => void,
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

          return null;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const messages = await channel.loadRecentMessages(11);

      expect(messages.length).toEqual(5);
    });

    it('should receive an error', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        fetchRecentMessages: () => {
          return Promise.reject('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channelI = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        await channelI.loadRecentMessages(10);
      } catch (e: any) {
        expect(e.message).toEqual(`Cannot load messages on "${channelI.channel._id}" channel.`);
      }
    });
  });

  describe.skip('loadPreviousMessages()', () => {
    it('should load 5 previous message', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        fetchRecentMessages: () => {
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
        fetchPreviousMessages: () => {
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

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      await channel.loadRecentMessages(5);

      const messages = await channel.loadPreviousMessages(5);

      expect(messages.length).toEqual(5);
    });
  });

  describe.skip('offMessageModified()', () => {
    it('should stop listening message modified', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
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

          return null;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleMessageModified = () => {};

      channel.onMessageModified(handleMessageModified);

      channel.offMessageModified();
    });
  });

  describe.skip('onMessageModified()', () => {
    it('should receive a message modified', (done) => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
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

          return null;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      channel.onMessageModified((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        expect(message.changeType).toEqual('modified');
        done();
      });
    });
  });

  describe.skip('onMessageReceived()', () => {
    it('should receive a message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
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

          return null;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      channel.onMessageReceived((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channelI = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        channelI.onMessageReceived((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e: any) {
        expect(e.message).toEqual(`Cannot watch new messages on "${channelI.channel._id}" channel.`);
      }
    });
  });

  describe('onMessageDeleted()', () => {
    it('should receive a message deleted', (done) => {
      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return {
          listenToChatConfigChanges: jest.fn(),
          listenToMessageReceived: (_: string, callback: (message: ChatMessage) => void) => {
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
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      channel.onMessageDeleted((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        expect(message.changeType).toEqual('removed');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToChatNewMessage: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channelI = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        channelI.onMessageDeleted((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e: any) {
        expect(e.message).toEqual(`Cannot watch deleted messages on "${channelI.channel._id}" channel.`);
      }
    });
  });

  describe('offAllListeners()', () => {
    it("should off all channel's listeners", () => {
      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return { listenToChatConfigChanges: jest.fn() };
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      channel.offAllListeners();
    });
  });

  describe('sendReaction()', () => {
    it('should send a reaction', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        sendReaction: () => {
          return Promise.resolve('new-reaction-key');
        },
      });

      RestAPI.getAPIInstance = mockAPIInstance;

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return { listenToChatConfigChanges: jest.fn() };
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const reaction: MessageReaction = {
        messageID: 'fake-message',
        type: 'like',
      };

      await channel.sendReaction(reaction);

      expect(createReactionSpy).toHaveBeenCalled();
    });
  });

  describe('deleteReaction()', () => {
    it('should delete a message reaction', async () => {
      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return { listenToChatConfigChanges: jest.fn() };
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const reaction: MessageReaction = {
        messageID: 'fake-message',
        type: 'like',
      };

      const result = await channel.deleteReaction(reaction);

      expect(result).toEqual([]);
    });
  });

  describe('fetchPinMessage({ channelId } : { channelId: string })', () => {
    it('should fetch pinned message for a channel', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        fetchPinMessage: async () => {
          return exampleChatMessage;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return { listenToChatConfigChanges: jest.fn() };
      });

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      const pinnedMessage = await channel.fetchPinMessage();

      expect(pinnedMessage).toEqual(exampleChatMessage);
    });

    it('should return an error when failed to fetch the pin message ', async () => {
      const graphQLAPIInstanceMock = {
        sendMessaToChannel: async () => {
          return Promise.reject('failed');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return { listenToChatConfigChanges: jest.fn() };
      });

      // @ts-ignore
      GraphQLAPI.instance = graphQLAPIInstanceMock;

      const channel = Channel.getInstance(exampleLiveChatChannel, exampleChatRoom);

      try {
        await channel.fetchPinMessage();
      } catch (e: any) {
        expect(e.message).toBe(`Cannot fetch pin messages on "${exampleChatRoom.slug}" channel.`);
      }
    });
  });
});
