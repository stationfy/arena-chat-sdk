import * as RealtimeAPI from '@services/realtime-api';
import { GraphQLAPI } from '@services/graphql-api';
import { Polls } from '@polls/polls';
import { exampleChatRoom, exampleLiveChatChannel, examplePoll, exampleUser } from '../../fixtures/examples';
import { Poll, PollFilter, ServerReaction } from '@arena-im/chat-types';
import { User } from '@arena-im/core';


jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: {
    instance: jest.fn(),
  },
}));

jest.mock('@arena-im/core', () => ({
  User: {
    instance: {
      data: jest.fn(),
    },
  },
  createObserver: jest.fn().mockImplementation(() => ({
    subscribe: jest.fn(),
    publish: jest.fn(),
  })),
  LogApi: jest.fn().mockImplementation(() => ({
    createContext: jest.fn(),
    error: jest.fn(),
  })),
  isPolls: () => true,
}));

describe('Polls', () => {
  beforeAll(() => {
    // @ts-ignore
    User.instance.data = exampleUser;
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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);
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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);
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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      try {
        await polls.loadPolls(PollFilter.ACTIVE, 5);
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual(`Cannot load polls on "${exampleLiveChatChannel._id}" chat channel.`);
      }
    });
  });

  describe('createPoll()', () => {
    beforeEach(() => {
      // @ts-ignore
      User.instance.data = {
        ...exampleUser,
        isModerator: true,
      };
    });

    afterEach(() => {
      // @ts-ignore
      User.instance.data = exampleUser;
    });
    it('should create a poll with options and a moderator user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        createPoll: async () => {
          return examplePoll;
        },
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      const result = await polls.createPoll({
        draft: false,
        duration: 900000,
        options: ['op 1', 'op 2'],
        question: 'what are you doing?',
        showVotes: true,
      });

      expect(result).toEqual(examplePoll);
    });

    it('should return an exception when the service is not working', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        createPoll: async () => {
          throw new Error('failed');
        },
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls
        .createPoll({
          draft: false,
          duration: 900000,
          options: ['op 1', 'op 2'],
          question: 'what are you doing?',
          showVotes: true,
        })
        .catch((error) => {
          expect(error.message).toEqual('Cannot create this poll question: "what are you doing?".');
          done();
        });
    });

    it('should return an exception when try to create a poll without a user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls
        .createPoll({
          draft: false,
          duration: 900000,
          options: ['op 1', 'op 2'],
          question: 'what are you doing?',
          showVotes: true,
        })
        .catch((error) => {
          expect(error.message).toEqual('Only moderators can create a poll.');
          done();
        });
    });

    it('should return an exception when try to create a poll without a moderator user', (done) => {
      // @ts-ignore
      User.instance.data = {
        ...exampleUser,
        isModerator: false,
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls
        .createPoll({
          draft: false,
          duration: 900000,
          options: ['op 1', 'op 2'],
          question: 'what are you doing?',
          showVotes: true,
        })
        .catch((error) => {
          expect(error.message).toEqual('Only moderators can create a poll.');
          done();
        });
    });
  });

  describe('deletePoll()', () => {
    beforeEach(() => {
      // @ts-ignore
      User.instance.data = {
        ...exampleUser,
        isModerator: true,
      };
    });

    afterEach(() => {
      // @ts-ignore
      User.instance.data = exampleUser;
    });
    it('should delete a poll with a moderator user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deletePoll: async () => {
          return examplePoll;
        },
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      const result = await polls.deletePoll(examplePoll);

      expect(result).toEqual(examplePoll);
    });

    it('should return an exception when the service is not working', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        createPoll: async () => {
          throw new Error('failed');
        },
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls.deletePoll(examplePoll).catch((error) => {
        expect(error.message).toEqual('Cannot delete the poll with this ID: "fake-poll".');
        done();
      });
    });

    it('should return an exception when try to delete a poll without a user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls.deletePoll(examplePoll).catch((error) => {
        expect(error.message).toEqual('Only moderators can delete a poll.');
        done();
      });
    });

    it('should return an exception when try to delete a poll without a moderator user', (done) => {
      // @ts-ignore
      User.instance.data = {
        ...exampleUser,
        isModerator: false,
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls.deletePoll(examplePoll).catch((error) => {
        expect(error.message).toEqual('Only moderators can delete a poll.');
        done();
      });
    });
  });

  describe('pollVote()', () => {
    afterEach(() => {
      // @ts-ignore
      User.instance.data = exampleUser;
    });

    it('should vote on a poll options', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        pollVote: async () => {
          return true;
        },
      };

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      polls.pollVote('111111', 0, '1234').catch((error) => {
        expect(error.message).toEqual('Cannot vote for the "111111" poll question.');
        done();
      });
    });

    it('should return an exception when try to vote without a user', (done) => {
      // @ts-ignore
      User.instance.data = null;

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      try {
        polls.onPollReceived((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e: unknown) {
        // @ts-ignore
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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      try {
        polls.onPollDeleted((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        // @ts-ignore
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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      try {
        polls.onPollModified((poll: Poll) => {
          console.log({ poll });
        });
      } catch (e) {
        // @ts-ignore
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

      const polls = new Polls(exampleLiveChatChannel, exampleChatRoom);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      polls.onPollModified(() => {});
      polls.offAllListeners();
    });
  });
});
