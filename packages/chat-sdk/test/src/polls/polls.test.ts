import * as RealtimeAPI from '@services/realtime-api';
import { GraphQLAPI } from '@services/graphql-api';
import { Polls } from '@polls/polls';
import { exampleChatRoom, exampleLiveChatChannel, examplePoll, exampleUser } from '../../fixtures/examples';
import { Poll, PollFilter, ServerReaction } from '@arena-im/chat-types';
import * as User from '@auth/user';

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: {
    instance: jest.fn(),
  }
}));

jest.mock('@auth/user', () => ({
  User: jest.fn(),
}));

describe('Polls', () => {
  beforeAll(() => {
    // @ts-ignore
    User.User.instance = jest.fn().mockReturnValue({
      data: exampleUser,
    });
  });
  describe('loadPolls()', () => {
    it('should load polls empty', async () => {
      const realtimeAPIInstanceMock = {
        fetchAllPolls: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);
      const items = await polls.loadPolls();

      expect(items).toEqual([]);
    });

    it('should load 5 polls', async () => {
      const realtimeAPIInstanceMock = {
        fetchAllPolls: () => {
          const items: Poll[] = new Array(5).fill(examplePoll);
          return Promise.resolve(items);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);
      const items = await polls.loadPolls(PollFilter.ACTIVE, 5);

      expect(items.length).toEqual(5);
    });

    it('should receive an error', async () => {
      const realtimeAPIInstanceMock = {
        fetchAllPolls: () => {
          return Promise.reject('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      try {
        await polls.loadPolls(PollFilter.ACTIVE, 5);
      } catch (e) {
        expect(e.message).toEqual(`Cannot load polls on "${exampleLiveChatChannel._id}" chat channel.`);
      }
    });
  });

  describe('pollVote()', () => {
    it('should vote on a poll options', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        pollVote: async () => {
          return true;
        },
      };

      const polls = new Polls(exampleLiveChatChannel);

      const result = await polls.pollVote('111111', 0, '1234');

      expect(result).toEqual(true);
    });

    it('should return an exception when the services is not working', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        pollVote: async () => {
          throw new Error('failed');
        },
      };

      const realtimeAPIInstanceMock = {
        fetchAllPolls: () => {
          return Promise.reject('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      polls.pollVote('111111', 0, '1234').catch((error) => {
        expect(error.message).toEqual('Cannot vote for the "111111" poll question.');
        done();
      });
    });

    it('should return an exception when try to vote without a user', (done) => {
      const polls = new Polls(exampleChatRoom);

      polls.pollVote('111111', 0).catch((error) => {
        expect(error.message).toEqual('Cannot vote without anonymoud id or user id.');
        done();
      });
    });
  });

  describe('offPollReceived()', () => {
    it('should stop listening poll received', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback(examplePoll);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollReceived(() => {});
      polls.offPollReceived();
    });
  });

  describe('onPollReceived()', () => {
    it('should receive a message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'added' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      polls.onPollReceived((poll: Poll) => {
        expect(poll._id).toEqual('fake-poll');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      try {
        polls.onPollReceived((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch new polls on "${exampleLiveChatChannel._id}" channel.`);
      }
    });
  });

  describe('offPollDeleted()', () => {
    it('should receive a poll deleted', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'removed' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollDeleted(() => {});
      polls.offPollDeleted();
    });
  });

  describe('onPollDeleted()', () => {
    it('should receive a poll deleted', (done) => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'removed' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      polls.onPollDeleted((poll: Poll) => {
        expect(poll._id).toEqual('fake-poll');
        expect(poll.changeType).toEqual('removed');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      try {
        polls.onPollDeleted((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch deleted polls on "${exampleLiveChatChannel._id}" channel.`);
      }
    });
  });

  describe('watchUserPollsReactions()', () => {
    it('should receive user reactions', () => {
      const realtimeAPIInstanceMock = {
        listenToUserChatPollsReactions: (_: string, __: string, callback: (reactions: ServerReaction[]) => void) => {
          callback([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      polls.watchUserPollsReactions('fake-user');
    });
  });

  describe('offPollModified()', () => {
    it('should receive a poll modified', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'modified' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollModified(() => {});
      polls.offPollModified();
    });
  });

  describe('onPollModified()', () => {
    it('should receive a poll modified', (done) => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'modified' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      polls.onPollModified((poll: Poll) => {
        expect(poll._id).toEqual('fake-poll');
        expect(poll.changeType).toEqual('modified');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      try {
        polls.onPollModified((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch polls modified on "${exampleLiveChatChannel._id}" channel.`);
      }
    });
  });

  describe('offAllListeners()', () => {
    it('should receive a poll modified', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (_: string, callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'modified' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleLiveChatChannel);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollModified(() => {});
      polls.offAllListeners();
    });
  });
});
