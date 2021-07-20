import { PresenceAPI } from '@services/presence-api';
import { WebSocketTransport } from '@transports/websocket-transport';

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
    },
  },
}));

test('should join properly', async () => {
  const siteId = 'site1';
  const channelId = 'channel1';
  const channelType = 'chat_room';

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
