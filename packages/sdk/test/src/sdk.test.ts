import { RestAPI } from '@services/rest-api';
import { Channel } from '@channel/channel';
import { ArenaChat } from '../../src/sdk';
import { PrivateChannel } from '@channel/private-channel';
import { exampleUser, exampleSite, exampleGroupChannel, exampleChatRoom, exampleQnaProps } from '../fixtures/examples';
import { Qna } from '@qna/qna';
import { ChatRoom, ExternalUser, Site } from '@arena-im/chat-types';
import { LiveChat } from '@live-chat/live-chat';

jest.mock('@services/rest-api', () => ({
  RestAPI: jest.fn(),
}));

jest.mock('@channel/channel', () => ({
  Channel: jest.fn(),
}));

jest.mock('@live-chat/live-chat', () => ({
  LiveChat: jest.fn(),
}));

jest.mock('@qna/qna', () => ({
  Qna: jest.fn(),
}));

jest.mock('@channel/private-channel', () => ({
  PrivateChannel: jest.fn(),
}));

describe('SDK', () => {
  beforeEach(() => {
    // @ts-ignore
    RestAPI.mockImplementation(() => {
      return {
        loadSite: async () => {
          return exampleSite;
        },
      };
    });
  });

  describe('getLiveChat()', () => {
    it('should get a live chat', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.resolve({ chatRoom: exampleChatRoom, site: exampleSite });
          },
        };
      });

      // @ts-ignore
      LiveChat.mockImplementation(() => {
        return {
          getChannels: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      const liveChatI = await sdk.getLiveChat('fake-chat');

      expect(typeof liveChatI.getChannels).toEqual('function');
    });

    it('should receive an error when the apiKey or channel is wrong', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.reject('invalid');
          },
        };
      });

      // @ts-ignore
      Channel.mockImplementation(() => {
        return {
          sendMessage: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      try {
        await sdk.getLiveChat('my-channel');
      } catch (e) {
        expect(e.message).toEqual('Invalid site (my-api-key) or live chat (my-channel) slugs.');
      }
    });

    it('should receive an error when there is an internal server error', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.reject('failed');
          },
        };
      });

      // @ts-ignore
      Channel.mockImplementation(() => {
        return {
          sendMessage: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      try {
        await sdk.getLiveChat('my-channel');
      } catch (e) {
        expect(e.message).toEqual('Internal Server Error. Contact the Arena support team.');
      }
    });
  });
  describe('setUser()', () => {
    it('should set an anonymous user', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          getArenaUser: () => {
            const user: ExternalUser = {
              id: '123456',
              name: 'Kristin Mckinney',
              image: 'https://randomuser.me/api/portraits/women/12.jpg',
              token: 'user-token-1234',
              isModerator: false,
            };
            return Promise.resolve(user);
          },
        };
      });

      const sender: ExternalUser = {
        id: '123456',
        name: 'Kristin Mckinney',
        image: 'https://randomuser.me/api/portraits/women/12.jpg',
        isModerator: false,
      };

      const sdk = new ArenaChat('my-api-key');

      const response = await sdk.setUser(sender);

      expect(response).toEqual({ ...sender, token: 'user-token-1234' });
    });

    it('should unset the current user', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          getArenaUser: () => {
            const user: ExternalUser = {
              id: '123456',
              name: 'Kristin Mckinney',
              image: 'https://randomuser.me/api/portraits/women/12.jpg',
              token: 'user-token-1234',
              isModerator: false,
            };
            return Promise.resolve(user);
          },
        };
      });

      const sdk = new ArenaChat('my-api-key');

      const response = await sdk.setUser(null);

      expect(response).toEqual(null);
    });
  });

  describe('blockPrivateUser()', () => {
    it('should block a user', async () => {
      const mockBlockPrivateUser = jest.fn();

      mockBlockPrivateUser.mockReturnValue(true);

      PrivateChannel.blockPrivateUser = mockBlockPrivateUser;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.blockPrivateUser('fake-user');

      expect(result).toBe(true);
    });

    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      sdk.blockPrivateUser('fake-user').catch((error) => {
        expect(error.message).toBe('Cannot block a user without a current user.');
        done();
      });
    });
  });

  describe('unblockPrivateUser()', () => {
    it('should unblock a user', async () => {
      const mockUnblockPrivateUser = jest.fn();

      mockUnblockPrivateUser.mockReturnValue(true);

      PrivateChannel.unblockPrivateUser = mockUnblockPrivateUser;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.unblockPrivateUser('fake-user');

      expect(result).toBe(true);
    });

    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      sdk.unblockPrivateUser('fake-user').catch((error) => {
        expect(error.message).toBe('Cannot unblock a user without a current user.');
        done();
      });
    });
  });

  describe('getPrivateChannel()', () => {
    it('should get a private channel', async () => {
      const mockGetGroupChannel = jest.fn();

      mockGetGroupChannel.mockReturnValue({});

      PrivateChannel.getGroupChannel = mockGetGroupChannel;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.getPrivateChannel('fake-channel');

      expect(result).toEqual({});
    });

    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      sdk.getPrivateChannel('fake-channel').catch((error) => {
        expect(error.message).toBe('Cannot get a private channel without a current user.');
        done();
      });
    });
  });

  describe('getUserPrivateChannels()', () => {
    it("should get all the user's private channels", async () => {
      const mockGetUserChannels = jest.fn();

      mockGetUserChannels.mockReturnValue([exampleGroupChannel]);

      PrivateChannel.getUserChannels = mockGetUserChannels;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.getUserPrivateChannels();

      expect(result).toEqual([exampleGroupChannel]);
    });

    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      sdk.getUserPrivateChannels().catch((error) => {
        expect(error.message).toBe('Cannot get the list of private channels without a current user.');
        done();
      });
    });
  });

  describe('createUserPrivateChannel()', () => {
    it('should create a new private channel', async () => {
      const mockCreateUserChannel = jest.fn();

      mockCreateUserChannel.mockReturnValue({});

      PrivateChannel.createUserChannel = mockCreateUserChannel;

      const sdk = new ArenaChat('my-api-key');

      sdk.user = exampleUser;

      const result = await sdk.createUserPrivateChannel('fake-user');

      expect(result).toEqual({});
    });

    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      sdk.createUserPrivateChannel('fake-user').catch((error) => {
        expect(error.message).toBe('Cannot create a private channel without a current user.');
        done();
      });
    });
  });

  describe('getChatQna', () => {
    it('should get a chat Q&A', async () => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.resolve({ chatRoom: { ...exampleChatRoom, qnaId: 'fake-qna-id' }, site: exampleSite });
          },
        };
      });
      // @ts-ignore
      Qna.mockImplementation(() => {
        return {
          addQuestion: jest.fn(),
          getQnaProps: async () => {
            return exampleQnaProps;
          },
        };
      });

      Qna.getQnaProps = async () => {
        return exampleQnaProps;
      };

      const sdk = new ArenaChat('my-api-key');

      const nextQna = await sdk.getChatQna('my-channel');

      expect(typeof nextQna.addQuestion).toEqual('function');
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      RestAPI.mockImplementation(() => {
        return {
          loadChatRoom: () => {
            return Promise.resolve({ chatRoom: { ...exampleChatRoom }, site: exampleSite });
          },
        };
      });
      // @ts-ignore
      Qna.mockImplementation(() => {
        return {
          addQuestion: jest.fn(),
        };
      });

      const sdk = new ArenaChat('my-api-key');

      sdk.getChatQna('my-channel').catch((error) => {
        expect(error.message).toEqual('Cannot get the Q&A for this chat: "my-channel"');
        done();
      });
    });
  });

  describe('onUnreadPrivateMessagesCountChanged()', () => {
    it('should return an error if there is no current user', (done) => {
      const sdk = new ArenaChat('my-api-key');

      sdk
        .onUnreadPrivateMessagesCountChanged((total: number) => {
          console.log({ total });
        })
        .catch((error) => {
          expect(error.message).toBe('Cannot listen to unread private messages without a current user.');
          done();
        });
    });

    it('should call the unread messages from the private chat', async () => {
      PrivateChannel.onUnreadMessagesCountChanged = jest.fn();

      const sdk = new ArenaChat('my-api-key');
      sdk.user = exampleUser;
      sdk.site = exampleSite;

      const spy = jest.spyOn(PrivateChannel, 'onUnreadMessagesCountChanged');

      const callback = (total: number) => {
        console.log({ total });
      };

      await sdk.onUnreadPrivateMessagesCountChanged(callback);

      expect(spy).toBeCalledTimes(1);
      expect(spy).toBeCalledWith(exampleUser, exampleSite, callback);
    });
  });

  describe('offUnreadMessagesCountChanged()', () => {
    it('should turn off the unread messages listener', (done) => {
      const mockListener = jest.fn();
      mockListener.mockReturnValue(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      });

      PrivateChannel.onUnreadMessagesCountChanged = mockListener;

      const sdk = new ArenaChat('my-api-key');
      sdk.user = exampleUser;
      sdk.site = exampleSite;

      sdk
        .onUnreadPrivateMessagesCountChanged((total: number) => {
          console.log({ total });
        })
        .then(() => {
          sdk.offUnreadMessagesCountChanged((result) => {
            expect(result).toBe(true);
            done();
          });
        });
    });

    it('should not turn off the unread messages without a listener', (done) => {
      const mockListener = jest.fn();
      mockListener.mockReturnValue(() => {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        return () => {};
      });

      PrivateChannel.onUnreadMessagesCountChanged = mockListener;

      const sdk = new ArenaChat('my-api-key');
      sdk.user = exampleUser;
      sdk.site = exampleSite;

      sdk.offUnreadMessagesCountChanged((result) => {
        expect(result).toBe(false);
        done();
      });
    });
  });
});
