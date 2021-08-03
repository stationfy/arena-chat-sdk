import { RestAPI } from '@services/rest-api';
import { Liveblog } from '@liveblog/liveblog';

const mockJoinUser = jest.fn();
const mockWatchChannelReactions = jest.fn();
const mockWatchUserReactions = jest.fn();

afterEach(() => {
  mockJoinUser.mockRestore();
  mockWatchChannelReactions.mockRestore();
  mockWatchUserReactions.mockRestore();
});

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@arena-im/core', () => ({
  PresenceAPI: {
    getInstance: () => ({
      joinUser: mockJoinUser,
    }),
  },
  Credentials: {
    apiKey: 'api_1',
  },
  ReactionsAPI: {
    getInstance: () => ({
      watchChannelReactions: mockWatchChannelReactions,
      watchUserReactions: mockWatchUserReactions,
    }),
  },
}));

test('should validate getInstance method', async () => {
  const mockAPIInstance = jest.fn();

  mockAPIInstance.mockReturnValue({
    loadLiveblog: jest.fn().mockResolvedValue({ liveblog: { name: 'blog1' } }),
  });

  RestAPI.getCachedInstance = mockAPIInstance;
  const instance = await Liveblog.getInstance('site1');

  expect(instance).toBeInstanceOf(Liveblog);
  expect(mockJoinUser).toHaveBeenCalled();
});

test('should validate watchChannelReactions method', async () => {
  const instance = await Liveblog.getInstance('site1');

  instance.watchChannelReactions(jest.fn());

  expect(mockWatchChannelReactions).toHaveBeenCalled();
});

test('should validate watchUserReactions method', async () => {
  const instance = await Liveblog.getInstance('site1');

  instance.watchUserReactions(jest.fn());

  expect(mockWatchUserReactions).toHaveBeenCalled();
});
