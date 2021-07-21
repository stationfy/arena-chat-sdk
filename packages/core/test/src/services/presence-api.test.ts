import { PresenceAPI } from '@services/presence-api';
import { WebSocketTransport } from '@transports/websocket-transport';
import { PresenceUser } from '@arena-im/chat-types';

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@auth/user-observable', () => ({
  UserObservable: {
    instance: {
      onUserChanged: jest.fn(),
    },
  },
}));

jest.mock('@auth/user', () => ({
  User: {
    instance: {
      data: {},
      loadCountry: jest.fn().mockResolvedValue('BR'),
    },
  },
}));

jest.mock('@transports/websocket-transport', () => ({
  WebSocketTransport: {
    instance: {
      on: jest.fn(),
      emit: jest.fn(),
      off: jest.fn(),
    },
  },
}));

const siteId = 'site1';
const channelId = 'channel1';
const channelType = 'chat_room';

test('should validate Presence constructor call', async () => {
  new PresenceAPI(siteId, channelId, channelType);

  expect(WebSocketTransport.instance.on).toHaveBeenCalledWith('reconnect', expect.any(Function));
});

test('should join properly', async () => {
  const expectedUserToJoin = {
    channelId,
    channelType,
    siteId,
    user: {
      country: 'BR',
      image: null,
      isAnonymous: false,
      isMobile: false,
      name: null,
      userId: undefined,
    },
  };

  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);

  await presenceAPI.joinUser();

  expect(WebSocketTransport.instance.emit).toHaveBeenCalledWith('join', expectedUserToJoin);
});

test('should validate updateUser method', async () => {
  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);
  presenceAPI.updateUser({} as PresenceUser);

  expect(WebSocketTransport.instance.emit).toHaveBeenCalledWith('user.setdata', {});
});

test('should validate getAllOnlineUsers method', async () => {
  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);
  presenceAPI.getAllOnlineUsers();
  const emitAsMock = WebSocketTransport.instance.emit as jest.Mock;

  expect(emitAsMock.mock.calls[2]).toEqual(['list', { channelId: 'channel1', status: 'online' }, expect.any(Function)]);
});

test('should validate updateUser method', async () => {
  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);
  presenceAPI.watchOnlineCount(jest.fn());

  expect(WebSocketTransport.instance.on).toHaveBeenCalledWith('presence.info', expect.any(Function));
});

test('should validate updateUser method', async () => {
  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);
  presenceAPI.watchUserJoined(jest.fn());

  expect(WebSocketTransport.instance.on).toHaveBeenCalledWith('user.joined', expect.any(Function));
});

test('should validate updateUser method', async () => {
  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);
  presenceAPI.watchUserLeft(jest.fn());

  expect(WebSocketTransport.instance.on).toHaveBeenCalledWith('user.left', expect.any(Function));
});

test('should turn off all Presence listeners', async () => {
  const presenceAPI = new PresenceAPI(siteId, channelId, channelType);
  presenceAPI.offAllListeners();

  expect(WebSocketTransport.instance.off).toHaveBeenCalledTimes(3);
});
