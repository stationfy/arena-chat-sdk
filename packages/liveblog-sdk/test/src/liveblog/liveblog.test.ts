import { RestAPI } from '@services/rest-api';
import { Liveblog } from '@liveblog/liveblog';

const mockJoinUser = jest.fn();
const mockWatchUserReactions = jest.fn();
const mockWatchReactionsErrors = jest.fn();

afterEach(() => {
  mockJoinUser.mockRestore();
  mockWatchUserReactions.mockRestore();
  mockWatchReactionsErrors.mockRestore();
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
  ReactionsAPIWS: {
    getInstance: () => ({
      watchUserReactions: mockWatchUserReactions,
      watchReactionsErrors: mockWatchReactionsErrors,
    }),
  },
  ReactionsAPIFirestore: {
    getInstance: () => ({
      watchUserReactions: mockWatchUserReactions,
      watchReactionsErrors: mockWatchReactionsErrors,
    }),
  },
}));

test('should validate getInstance method', async () => {
  const mockAPIInstance = jest.fn();

  mockAPIInstance.mockReturnValue({
    loadLiveblog: jest.fn().mockResolvedValue({ liveblog: { name: 'blog1' } }),
  });

  RestAPI.getAPIInstance = mockAPIInstance;
  const instance = await Liveblog.getInstance('site1');

  expect(instance).toBeInstanceOf(Liveblog);
  expect(mockJoinUser).toHaveBeenCalled();
});

test('should validate watchUserReactions method', async () => {
  const instance = await Liveblog.getInstance('site1');

  instance.watchUserReactions(jest.fn());

  expect(mockWatchUserReactions).toHaveBeenCalled();
});
test('should validate watchReactionsErrors method', async () => {
  const instance = await Liveblog.getInstance('site1');

  instance.watchReactionsErrors(jest.fn());

  expect(mockWatchReactionsErrors).toHaveBeenCalled();
});
