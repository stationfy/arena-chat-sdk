import { Channel } from '@channel/channel';
import {
  ChatRoom,
  ExternalUser,
  UserChangedListener,
  Moderation,
  ModeratorStatus,
  LiveChatChannel,
  MessageReaction,
  ServerReaction,
  ChatMessageSender,
} from '@arena-im/chat-types';
import { Site } from '@arena-im/chat-types';

import * as GraphQLAPI from '@services/graphql-api';
import { RestAPI } from '@services/rest-api';
import { ChatMessage } from '@arena-im/chat-types';
import * as RealtimeAPI from '@services/realtime-api';
import { ArenaHub } from '@services/arena-hub';
import { ArenaChat } from '../../../src/sdk';
import { exampleChatMessage, exampleChatRoom, exampleLiveChatChannel, exampleSDK } from '../../fixtures/examples';

jest.mock('@services/arena-hub', () => ({
  ArenaHub: jest.fn(),
}));

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: jest.fn(),
}));

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
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

describe('Channel', () => {
  const sdk = new ArenaChat('my-api-key');

  beforeEach(() => {
    jest.resetAllMocks();

    const site: Site = {
      _id: 'site-id',
      displayName: 'First Site',
      settings: {
        graphqlPubApiKey: '1234',
      },
    };

    sdk.site = site;

    sdk.user = {
      image: 'https://randomuser.me/api/portraits/women/12.jpg',
      name: 'Kristin Mckinney',
      id: '123456',
      email: 'test@test.com',
    };

    // @ts-ignore
    RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
      return {
        listenToChatConfigChanges: jest.fn(),
      };
    });

    // @ts-ignore
    ArenaHub.mockImplementation(() => {
      return {
        track: jest.fn(),
      };
    });

    // @ts-ignore
    sdk.restAPI = {};
  });

  describe('banUser()', () => {
    it('should ban a user', (done) => {
      // @ts-ignore
      const sdk: ArenaChat = { ...exampleSDK };
      // @ts-ignore
      sdk.restAPI = {
        banUser: () => {
          return Promise.resolve();
        },
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, sdk);

      const user: ChatMessageSender = {
        photoURL: 'https://www.google.com',
        displayName: 'Ban User',
        uid: 'test-ban-user-id',
      };

      channel.banUser(user).then(done);
    });

    it('should receive an error when ban a user', (done) => {
      // @ts-ignore
      sdk.restAPI = {
        banUser: () => {
          return Promise.reject('failed');
        },
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

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
      // @ts-ignore
      const sdk: ArenaChat = { ...exampleSDK };
      // @ts-ignore
      sdk.restAPI = {
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
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, sdk);

      const moderation = await channel.requestModeration();

      expect(moderation.chatRoomId).toBe('new-chatroom');
      expect(moderation.siteId).toBe('site-id');
      expect(moderation.userId).toBe('123456');
      expect(moderation.status).toEqual('PENDING');
    });

    it('should receive an error when request moderation', (done) => {
      // @ts-ignore
      sdk.restAPI = {
        requestModeration: async () => {
          return Promise.reject('failed');
        },
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      channel.requestModeration().catch((e) => {
        expect(e.message).toBe(
          `Cannot request moderation for user: "${exampleSDK.user?.id}". Contact the Arena support team.`,
        );
        done();
      });
    });
  });

  describe('deleteMessage()', () => {
    it('should delete a message by a moderator', async () => {
      const graphQLAPIInstanceMock = {
        deleteOpenChannelMessage: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

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
      sdk.restAPI = {
        deleteMessage: async () => {
          return Promise.reject('failed');
        },
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

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
      const graphQLAPIInstanceMock = {
        sendMessaToChannel: async () => {
          return exampleChatMessage.key;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      const sentMessage = await channel.sendMessage({ text: 'hey!' });

      expect(sentMessage).toEqual(exampleChatMessage.key);
    });

    it('should receive an error when try to send a message', async () => {
      const graphQLAPIInstanceMock = {
        sendMessaToChannel: async () => {
          return Promise.reject('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        await channel.sendMessage({ text: 'hey!' });
      } catch (e) {
        expect(e.message).toBe('Cannot send this message: "hey!". Contact the Arena support team.');
      }
    });

    it('should receive an error when try to send an empty message', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          sendMessage: (_: ChatRoom, chatMessage: ChatMessage) => {
            chatMessage.key = 'new-message-key';
            return Promise.resolve(chatMessage);
          },
        };
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        const message = await channel.sendMessage({ text: '' });
        expect(message).toEqual(null);
      } catch (e) {
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
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      const sentMessage = await channel.sendMonetizationMessage({ text: 'donated' });

      expect(sentMessage).toEqual(exampleChatMessage.key);
    });

    it('should receive an error when try to send a message', async () => {
      const graphQLAPIInstanceMock = {
        sendMonetizationMessageToChannel: async () => {
          return Promise.reject('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        await channel.sendMonetizationMessage({ text: 'donated' });
      } catch (e) {
        expect(e.message).toBe('Cannot send this message: "donated". Contact the Arena support team.');
      }
    });
  });

  it('should create an instance of realtime api with chatroom id', () => {
    const spy = jest.spyOn(RealtimeAPI.RealtimeAPI, 'getInstance');

    new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith();
  });

  describe('listenToChatConfigChanges()', () => {
    it('should listen to chat config changes', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const spy = jest.spyOn(realtimeAPIInstanceMock, 'listenToChatConfigChanges');

      new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should apply the chat config changes', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: (_: string, callback: (channel: LiveChatChannel) => void) => {
          const channel: LiveChatChannel = {
            ...exampleLiveChatChannel,
            allowSendGifs: false,
          };
          callback(channel);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channelI = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      expect(channelI.channel.allowSendGifs).toBeFalsy();
    });
  });

  describe('loadRecentMessages()', () => {
    it('should load recent messages empty', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        fetchRecentMessages: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      const messages = await channel.loadRecentMessages(10);

      expect(messages).toEqual([]);
    });

    it('should load 5 recent messages', async () => {
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
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      const messages = await channel.loadRecentMessages(10);

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

      const channelI = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        await channelI.loadRecentMessages(10);
      } catch (e) {
        expect(e.message).toEqual(`Cannot load messages on "${channelI.channel._id}" channel.`);
      }
    });
  });

  describe('loadPreviousMessages()', () => {
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

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      await channel.loadRecentMessages(5);

      const messages = await channel.loadPreviousMessages(5);

      expect(messages.length).toEqual(5);
    });
  });

  describe('offMessageModified()', () => {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleMessageModified = () => {};

      channel.onMessageModified(handleMessageModified);

      channel.offMessageModified();
    });
  });

  describe('onMessageModified()', () => {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      channel.onMessageModified((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
        expect(message.changeType).toEqual('modified');
        done();
      });
    });
  });

  describe('offMessageReceived()', () => {
    it('should stop listening message received', () => {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      channel.onMessageReceived(() => {});
      channel.offMessageReceived();
    });
  });

  describe('onMessageReceived()', () => {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

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

      const channelI = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        channelI.onMessageReceived((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch new messages on "${channelI.channel._id}" channel.`);
      }
    });
  });

  describe('offMessageDeleted()', () => {
    it('should receive a message deleted', () => {
      const realtimeAPIInstanceMock = {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      channel.onMessageDeleted(() => {});
      channel.offMessageDeleted();
    });
  });

  describe('onMessageDeleted()', () => {
    it('should receive a message deleted', (done) => {
      const realtimeAPIInstanceMock = {
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
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

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

      const channelI = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        channelI.onMessageDeleted((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch deleted messages on "${channelI.channel._id}" channel.`);
      }
    });
  });

  describe('offAllListeners()', () => {
    it("should off all channel's listeners", () => {
      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      channel.offAllListeners();
    });
  });

  describe('sendReaction()', () => {
    it('should send a reaction', async () => {
      // @ts-ignore
      const sdk: ArenaChat = { ...exampleSDK };
      // @ts-ignore
      sdk.restAPI = {
        sendReaction: () => {
          return Promise.resolve('new-reaction-key');
        },
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, sdk);

      const reaction: MessageReaction = {
        messageID: 'fake-message',
        type: 'like',
      };

      const result: MessageReaction = await channel.sendReaction(reaction);

      expect(result.id).toEqual('new-reaction-key');
      expect(result.type).toEqual('like');
      expect(result.messageID).toEqual('fake-message');
    });
  });

  describe('deleteReaction()', () => {
    it('should delete a message reaction', async () => {
      const graphQLAPIInstanceMock = {
        deleteReaction: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      const reaction: MessageReaction = {
        messageID: 'fake-message',
        type: 'like',
      };

      const result = await channel.deleteReaction(reaction);

      expect(result).toEqual(true);
    });

    it('should receive an error when delete a message', async () => {
      const graphQLAPIInstanceMock = {
        deleteReaction: async () => {
          return Promise.reject('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      const reaction: MessageReaction = {
        messageID: 'fake-message',
        type: 'like',
      };

      try {
        await channel.deleteReaction(reaction);
      } catch (e) {
        expect(e.message).toBe(`Cannot delete reaction from message "${reaction.messageID}"`);
      }
    });
  });

  describe('watchUserChanged()', () => {
    beforeEach(() => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: jest.fn(),
        listenToUserReactions: (__: string, _: ExternalUser, callback: (reactions: ServerReaction[]) => void) => {
          const reaction: ServerReaction = {
            itemType: 'chatMessage',
            reaction: 'love',
            publisherId: 'fake-site-id',
            itemId: 'fake-message-key',
            chatRoomId: 'fake-chat-room-key',
            userId: 'fake-user-uid',
          };

          const reactions: ServerReaction[] = [reaction];

          callback(reactions);
        },
        fetchRecentMessages: () => {
          const message: ChatMessage = {
            createdAt: 1592342151026,
            key: 'fake-message-key',
            message: {
              text: 'testing',
            },
            publisherId: 'fake-site-id',
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
    });
    it('should call watchUserChanged without watch for messages modified', async () => {
      const user: ExternalUser = {
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        name: 'Kristin Mckinney',
        id: 'fake-user-uid',
        email: 'test@test.com',
      };

      let localCallback;

      // @ts-ignore
      const sdk: ArenaChat = { ...exampleSDK };

      // @ts-ignore
      sdk.onUserChanged = (callback: UserChangedListener) => {
        localCallback = callback;
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, sdk);

      await channel.loadRecentMessages(10);

      // @ts-ignore
      localCallback.call(channel, user);
    });

    it('should call watchUserChanged with watch for messages modified', async (done) => {
      const user: ExternalUser = {
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        name: 'Kristin Mckinney',
        id: 'fake-user-uid',
        email: 'test@test.com',
      };

      let localCallback;

      // @ts-ignore
      const sdk: ArenaChat = { ...exampleSDK };

      // @ts-ignore
      sdk.onUserChanged = (callback: UserChangedListener) => {
        localCallback = callback;
      };

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, sdk);

      channel.onMessageModified((message: ChatMessage) => {
        expect(message?.currentUserReactions?.love).toBeTruthy();

        done();
      });

      await channel.loadRecentMessages(10);

      // @ts-ignore
      localCallback.call(channel, user);
    });
  });

  describe('fetchPinMessage({ channelId } : { channelId: string })', () => {
    it('should fetch pinned message for a channel', async () => {
      const graphQLAPIInstanceMock = {
        fetchPinMessage: async () => {
          return exampleChatMessage;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

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
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const channel = new Channel(exampleLiveChatChannel, exampleChatRoom, exampleSDK);

      try {
        await channel.fetchPinMessage();
      } catch (e) {
        expect(e.message).toBe(`Cannot fetch pin messages on "${exampleChatRoom.slug}" channel.`);
      }
    });
  });
});
