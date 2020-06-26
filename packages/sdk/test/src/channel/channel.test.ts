import { Channel } from '@channel/channel';
import { ChatRoom } from '@models/chat-room';
import { Site } from '@models/site';

import { RestAPI } from '@services/rest-api';
import { ChatMessage } from '@models/chat-message';
import * as RealtimeAPI from '@services/realtime-api';
import { ArenaChat } from '../../../src/sdk';

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
    id: 'new-chatroom',
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
    expect(spy).toHaveBeenCalledWith(chatRoom.id);
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

  describe('watchNewMessage()', () => {
    it('should receive a message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToChatConfigChanges: jest.fn(),
        listenToChatNewMessage: (callback: (message: ChatMessage) => void) => {
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

          callback(message);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const channel = new Channel(chatRoom, sdk);

      channel.watchNewMessage((message: ChatMessage) => {
        expect(message.key).toEqual('fake-key');
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
        channel.watchNewMessage((message: ChatMessage) => {
          console.log({ message });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch new message on "${channel.chatRoom.slug}" channel.`);
      }
    });
  });
});