import { Channel } from '@channel/channel';
import {
  ChatRoom,
  ExternalUser,
  UserChangedListener,
  Moderation,
  ModeratorStatus,
  BanUser,
} from '@arena-im/chat-types';
import { Site } from '@arena-im/chat-types';

import { RestAPI } from '@services/rest-api';
import { ChatMessage } from '@arena-im/chat-types';
import * as RealtimeAPI from '@services/realtime-api';
import { ArenaChat } from '../../../src/sdk';
import { MessageReaction, ServerReaction } from '@arena-im/chat-types/dist/chat-message';

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

  const sdk = new ArenaChat('my-api-key');
  sdk.site = site;
  sdk.user = {
    image: 'https://randomuser.me/api/portraits/women/12.jpg',
    name: 'Kristin Mckinney',
    id: '123456',
    email: 'test@test.com',
  };

  beforeEach(() => {
    jest.resetAllMocks();
    // @ts-ignore
    RealtimeAPI.RealtimeAPI.mockImplementation(() => {
      return {
        listenToChatConfigChanges: jest.fn(),
      };
    });

    // @ts-ignore
    sdk.restAPI = {};
  });

  describe('banUser()', () => {
    it('should ban a user', async (done) => {
      // @ts-ignore
      sdk.restAPI = {
        banUser: () => {
          return Promise.resolve();
        },
      };

      const channel = new Channel(chatRoom, sdk);

      const user: BanUser = {
        image: 'https://www.google.com',
        name: 'Ban User',
        siteId: site._id,
        userId: 'test-ban-user-id',
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

      const channel = new Channel(chatRoom, sdk);

      const user: BanUser = {
        image: 'https://www.google.com',
        name: 'Ban User',
        siteId: site._id,
        userId: 'test-ban-user-id',
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

      const channel = new Channel(chatRoom, sdk);

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

      const channel = new Channel(chatRoom, sdk);

      channel.requestModeration().catch((e) => {
        expect(e.message).toBe('Cannot request moderation for user: "123456". Contact the Arena support team.');
        done();
      });
    });
  });

  describe('deleteMessage()', () => {
    it('should delete a message by a moderator', (done) => {
      // @ts-ignore
      sdk.restAPI = {
        deleteMessage: () => {
          return Promise.resolve();
        },
      };

      const channel = new Channel(chatRoom, sdk);

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

      channel.deleteMessage(message).then(done);
    });

    it('should receive an error when delete a message', (done) => {
      // @ts-ignore
      sdk.restAPI = {
        deleteMessage: async () => {
          return Promise.reject('failed');
        },
      };

      const channel = new Channel(chatRoom, sdk);

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
      sdk.restAPI = {
        sendMessage: (_: ChatRoom, chatMessage: ChatMessage) => {
          chatMessage.key = 'new-message-key';
          return Promise.resolve(chatMessage);
        },
      };

      const channel = new Channel(chatRoom, sdk);

      const sentMessage = await channel.sendMessage('hey!');

      expect(sentMessage.key).toEqual('new-message-key');
      expect(sentMessage.message.text).toEqual('hey!');
    });

    it('should receive an error when try to send a message', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          sendMessage: () => {
            return Promise.reject('failed');
          },
        };
      });

      const channel = new Channel(chatRoom, sdk);

      try {
        await channel.sendMessage('hey!');
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

      const channel = new Channel(chatRoom, sdk);

      try {
        const message = await channel.sendMessage('');
        expect(message).toEqual(null);
      } catch (e) {
        expect(e.message).toBe('Cannot send an empty message.');
      }
    });
  });

  it('should create an instance of realtime api with chatroom id', () => {
    const spy = jest.spyOn(RealtimeAPI, 'RealtimeAPI');

    new Channel(chatRoom, sdk);

    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith(chatRoom._id);
  });

  describe('listenToChatConfigChanges()', () => {
    it('should listen to chat config changes', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const spy = jest.spyOn(realtimeAPIInstanceMock, 'listenToChatConfigChanges');

      new Channel(chatRoom, sdk);

      expect(spy).toHaveBeenCalledTimes(1);
    });

    it('should apply the chat config changes', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: (callback: (chatRoom: ChatRoom) => void) => {
          const nextChatRoom: ChatRoom = {
            ...chatRoom,
            allowSendGifs: false,
          };
          callback(nextChatRoom);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      expect(channel.chatRoom.allowSendGifs).toBeFalsy();
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      try {
        await channel.loadRecentMessages(10);
      } catch (e) {
        expect(e.message).toEqual(`Cannot load messages on "${channel.chatRoom.slug}" channel.`);
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      await channel.loadRecentMessages(5);

      const messages = await channel.loadPreviousMessages(5);

      expect(messages.length).toEqual(5);
    });
  });

  describe('offMessageModified()', () => {
    it('should stop listening message modified', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (callback: (message: ChatMessage) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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
        listenToMessageReceived: (callback: (message: ChatMessage) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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
        listenToMessageReceived: (callback: (message: ChatMessage) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      channel.onMessageReceived(() => {});
      channel.offMessageReceived();
    });
  });

  describe('onMessageReceived()', () => {
    it('should receive a message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (callback: (message: ChatMessage) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      try {
        channel.onMessageReceived((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch new messages on "${channel.chatRoom.slug}" channel.`);
      }
    });
  });

  describe('offMessageDeleted()', () => {
    it('should receive a message deleted', () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (callback: (message: ChatMessage) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      channel.onMessageDeleted(() => {});
      channel.offMessageDeleted();
    });
  });

  describe('onMessageDeleted()', () => {
    it('should receive a message deleted', (done) => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: (callback: (message: ChatMessage) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      try {
        channel.onMessageDeleted((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch deleted messages on "${channel.chatRoom.slug}" channel.`);
      }
    });
  });

  describe('offAllListeners()', () => {
    it("should off all channel's listeners", () => {
      const channel = new Channel(chatRoom, sdk);

      channel.offAllListeners();
    });
  });

  describe('sendReaction()', () => {
    it('should send a reaction', async () => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        sendReaction: async () => {
          return {
            key: 'new-reaction-key',
            reaction: 'like',
            itemId: 'fake-message',
          };
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

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

  describe('watchUserChanged()', () => {
    beforeEach(() => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToMessageReceived: jest.fn(),
        listenToUserReactions: (_: ExternalUser, callback: (reactions: ServerReaction[]) => void) => {
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
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
      sdk.onUserChanged = (callback: UserChangedListener) => {
        localCallback = callback;
      };

      const channel = new Channel(chatRoom, sdk);

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
      sdk.onUserChanged = (callback: UserChangedListener) => {
        localCallback = callback;
      };

      const channel = new Channel(chatRoom, sdk);

      channel.onMessageModified((message: ChatMessage) => {
        expect(message?.currentUserReactions?.love).toBeTruthy();

        done();
      });

      await channel.loadRecentMessages(10);

      // @ts-ignore
      localCallback.call(channel, user);
    });
  });
});
