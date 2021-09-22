import { PresenceAPI } from '@services/presence-api';
import { WebSocketTransport } from '@transports/websocket-transport';
import { PresenceUser } from '@arena-im/chat-types';
import { UserObservable } from '@auth/user-observable';

const mockOnOnlineCountChanged = jest.fn();

afterEach(() => {
  mockOnOnlineCountChanged.mockRestore();
});

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

jest.mock('@services/presence-observable', () => ({
  PresenceObservable: {
    getInstance: () => ({
      onOnlineCountChanged: mockOnOnlineCountChanged,
      updateUserJoined: jest.fn(),
      updateUserSetted: jest.fn(),
    }),
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
    getInstance: jest.fn().mockReturnValue({
      on: jest.fn(),
      // @ts-ignore
      emit: jest.fn().mockImplementation((eventName, params, callback) => {
        callback?.(null, true);
      }),
      off: jest.fn(),
    }),
  },
}));

const siteId = 'site1';
const channelId = 'channel1';
const channelType = 'chat_room';

test('should validate Presence constructor call', () => {
  PresenceAPI.getInstance(siteId, channelId, channelType);

  expect(UserObservable.instance.onUserChanged).toHaveBeenCalled();
  expect(WebSocketTransport.getInstance(channelId).on).toHaveBeenCalledWith('reconnect', expect.any(Function));
  expect(WebSocketTransport.getInstance(channelId).on).toHaveBeenCalledWith('presence.info', expect.any(Function));
});

test('should validate join method', async () => {
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

  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);

  await presenceAPI.joinUser();

  expect(WebSocketTransport.getInstance(channelId).emit).not.toHaveBeenCalledWith('join', expectedUserToJoin);
});

test('should validate updateUser method', () => {
  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);
  presenceAPI.updateUser({} as PresenceUser);

  expect(WebSocketTransport.getInstance(channelId).emit).toHaveBeenCalledWith('user.change', {});
});

test('should validate getAllOnlineUsers method', () => {
  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);
  presenceAPI.getAllOnlineUsers();
  const mockEmit = WebSocketTransport.getInstance(channelId).emit as jest.Mock;

  expect(mockEmit.mock.calls[2]).toEqual(['list', { channelId: 'channel1', status: 'online' }, expect.any(Function)]);
});

test('should validate watchOnlineCount method', () => {
  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);
  const callback = jest.fn();

  presenceAPI.watchOnlineCount(callback);

  expect(mockOnOnlineCountChanged).toHaveBeenCalled();
});

test('should validate watchUserJoined method', () => {
  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);
  presenceAPI.watchUserJoined(jest.fn());

  expect(WebSocketTransport.getInstance(channelId).on).toHaveBeenCalledWith('user.joined', expect.any(Function));
});

test('should validate watchUserLeft method', () => {
  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);
  presenceAPI.watchUserLeft(jest.fn());

  expect(WebSocketTransport.getInstance(channelId).on).toHaveBeenCalledWith('user.left', expect.any(Function));
});

test('should turn off all Presence listeners', () => {
  const presenceAPI = PresenceAPI.getInstance(siteId, channelId, channelType);
  presenceAPI.offAllListeners();

  expect(WebSocketTransport.getInstance(channelId).off).toHaveBeenCalledTimes(3);
});
