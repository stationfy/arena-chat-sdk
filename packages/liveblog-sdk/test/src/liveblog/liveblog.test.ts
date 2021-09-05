import { RestAPI } from '@services/rest-api';
import { Liveblog } from '@liveblog/liveblog';
import { MessageReaction } from '@arena-im/chat-types';

const mockJoinUser = jest.fn();
const mockWatchUserReactions = jest.fn();

afterEach(() => {
  mockJoinUser.mockRestore();
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
    getInstance: jest.fn().mockReturnValue({
      watchUserReactions: mockWatchUserReactions,
      deleteReaction: jest.fn().mockResolvedValue(true),
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

test('should validate watchUserReactions method', async () => {
  const instance = await Liveblog.getInstance('site1');

  instance.watchUserReactions(jest.fn());

  expect(mockWatchUserReactions).toHaveBeenCalled();
});

test.only('should delete a reaction', async () => {
  const mockAPIInstance = jest.fn();

  mockAPIInstance.mockReturnValue({
    loadLiveblog: jest.fn().mockResolvedValue({ liveblog: { name: 'blog1' } }),
  });

  RestAPI.getCachedInstance = mockAPIInstance;
  const instance = await Liveblog.getInstance('site1');
  const reaction = {} as MessageReaction;

  const result = await instance.deleteReaction(reaction);

  expect(result).toBeTruthy();
});
