import { Channel } from '../../../src/channel/channel';
import { ChatRoom } from '../../../src/types/chat-room';
import { Site } from '../../../src/types/site';

import { RestAPI } from '../../../src/services/rest-api';
import { ChatMessage } from '../../../src/types/chat-message';
import * as RealtimeAPI from '../../../src/services/realtime-api';

jest.mock('../../../src/services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('../../../src/services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
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
      RestAPI.mockImplementation(() => {
        return {
          sendMessage: (chatRoom: ChatRoom, chatMessage: ChatMessage) => {
            chatMessage.key = 'new-message-key';
            return Promise.resolve(chatMessage);
          },
        };
      });

      const channel = new Channel(chatRoom, site);

      const sentMessage = await channel.sendMessage('hey!');

      expect(sentMessage.key).toEqual('new-message-key');
      expect(sentMessage.message.text).toEqual('hey!');
    });

    it('should receive an error when try to send a message', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          sendMessage: (chatRoom: ChatRoom, chatMessage: ChatMessage) => {
            return Promise.reject('failed');
          },
        };
      });

      const channel = new Channel(chatRoom, site);

      try {
        await channel.sendMessage('hey!');
      } catch (e) {
        expect(e.message).toBe('Cannot send this message: "hey!". Contact the Arena support team.');
      }
    });
  });

  it('should create an instance of realtime api with chatroom id', () => {
    const spy = jest.spyOn(RealtimeAPI, 'RealtimeAPI');

    new Channel(chatRoom, site);

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

      new Channel(chatRoom, site);

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

      const channel = new Channel(chatRoom, site);

      expect(channel.chatRoom.allowSendGifs).toBeFalsy();
    });
  });
});
