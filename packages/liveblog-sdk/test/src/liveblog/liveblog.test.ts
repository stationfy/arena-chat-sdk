import { RestAPI } from '@services/rest-api';
import { Liveblog } from '@liveblog/liveblog';

const mockJoinUser = jest.fn();

afterEach(() => {
  mockJoinUser.mockRestore();
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
