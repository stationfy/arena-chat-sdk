import * as RealtimeAPI from '@services/realtime-api';
import * as GraphQLAPI from '@services/graphql-api';
import { Polls } from '@polls/polls';
import { exampleChatRoom, examplePoll, exampleSDK } from '../../fixtures/examples';
import { Poll, PollFilter, ServerReaction } from '@arena-im/chat-types';
import ArenaChat from 'src';

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: jest.fn(),
}));

describe('Polls', () => {
  describe('loadPolls()', () => {
    it('should load polls empty', async () => {
      const realtimeAPIInstanceMock = {
        fetchAllPolls: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);
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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      try {
        await polls.loadPolls(PollFilter.ACTIVE, 5);
      } catch (e) {
        expect(e.message).toEqual('Cannot load polls on "new-chatroom" chat channel.');
      }
    });
  });

  describe('pollVote()', () => {
    it('should vote on a poll options', async () => {
      const graphQLAPIInstanceMock = {
        pollVote: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      const result = await polls.pollVote('111111', 0, '1234');

      expect(result).toEqual(true);
    });

    it('should return an exception when the services is not working', (done) => {
      const graphQLAPIInstanceMock = {
        pollVote: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      polls.pollVote('111111', 0, '1234').catch((error) => {
        expect(error.message).toEqual('Cannot vote for the "111111" poll question.');
        done();
      });
    });

    it('should return an exception when try to vote without a user', (done) => {
      const sdk: ArenaChat = exampleSDK;
      sdk.user = null;
      const polls = new Polls(exampleChatRoom, sdk);

      polls.pollVote('111111', 0).catch((error) => {
        expect(error.message).toEqual('Cannot vote without anonymoud id or user id.');
        done();
      });
    });
  });

  describe('offPollReceived()', () => {
    it('should stop listening poll received', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback(examplePoll);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollReceived(() => {});
      polls.offPollReceived();
    });
  });

  describe('onPollReceived()', () => {
    it('should receive a message', (done) => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'added' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      try {
        polls.onPollReceived((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch new polls on "${exampleChatRoom.slug}" channel.`);
      }
    });
  });

  describe('offPollDeleted()', () => {
    it('should receive a poll deleted', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'removed' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollDeleted(() => {});
      polls.offPollDeleted();
    });
  });

  describe('onPollDeleted()', () => {
    it('should receive a poll deleted', (done) => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'removed' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      try {
        polls.onPollDeleted((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch deleted polls on "${exampleChatRoom.slug}" channel.`);
      }
    });
  });

  describe('watchUserPollsReactions()', () => {
    it('should receive user reactions', () => {
      const realtimeAPIInstanceMock = {
        listenToUserChatPollsReactions: (_: string, callback: (reactions: ServerReaction[]) => void) => {
          callback([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      polls.watchUserPollsReactions('fake-user');
    });
  });

  describe('offPollModified()', () => {
    it('should receive a poll modified', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'modified' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollModified(() => {});
      polls.offPollModified();
    });
  });

  describe('onPollModified()', () => {
    it('should receive a poll modified', (done) => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'modified' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

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
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      try {
        polls.onPollModified((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch polls modified on "${exampleChatRoom.slug}" channel.`);
      }
    });
  });

  describe('offAllListeners()', () => {
    it('should receive a poll modified', () => {
      const realtimeAPIInstanceMock = {
        listenToPollReceived: (callback: (poll: Poll) => void) => {
          callback({ ...examplePoll, changeType: 'modified' });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const polls = new Polls(exampleChatRoom, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollModified(() => {});
      polls.offAllListeners();
    });
  });
});
