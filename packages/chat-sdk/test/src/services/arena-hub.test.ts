import { ArenaHub } from '@services/arena-hub';
import { OrganizationSite, User } from '@arena-im/core';
import { exampleChatRoom, exampleSite, exampleUser } from '../../fixtures/examples';
import * as misc from '@utils/misc';
import { RestAPI } from '@services/rest-api';

let window: jest.SpyInstance;

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@arena-im/core', () => ({
  OrganizationSite: {
    instance: jest.fn(),
  },
  User: jest.fn(),
}));

describe('ArenaHub', () => {
  beforeEach(() => {
    window = jest.spyOn(misc, 'getGlobalObject');

    window.mockReturnValue({
      location: {
        pathname: '/2020/09/10/private-chat-bottom/',
        search: '',
        href: 'https://www.google.com/',
      },
      document: {
        referrer: 'https://www.google.com/',
        title: 'Google',
      },
      navigator: {
        userAgent:
          'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/86.0.4240.80 Safari/537.36',
        language: 'en-US',
      },
      crypto: {
        getRandomValues: () => 0,
      },
    });

    // @ts-ignore
    User.instance = jest.fn().mockReturnValue({
      data: exampleUser,
    });

    // @ts-ignore
    OrganizationSite.instance.getSite = jest.fn(() => exampleSite);
  });
  describe('track()', () => {
    it('should track page', async () => {
      const mockAPIInstance = jest.fn();

      mockAPIInstance.mockReturnValue({
        collect: () => {
          return Promise.resolve({ success: true });
        },
      });

      RestAPI.getAPINoauthInstance = mockAPIInstance;

      const arenaHub = ArenaHub.getInstance(exampleChatRoom);

      const result = await arenaHub.trackPage();

      expect(result).toEqual({ success: true });
    });
  });
});
