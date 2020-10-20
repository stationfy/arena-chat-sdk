import { Qna } from '@qna/qna';
import { exampleQnaProps, exampleQnaQuestion, exampleSDK, exampleSite } from '../../fixtures/examples';
import * as GraphQLAPI from '@services/graphql-api';
import * as RealtimeAPI from '@services/realtime-api';
import { QnaQuestion } from '@arena-im/chat-types';
import { ArenaChat } from '../../../src/sdk';

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: jest.fn(),
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

describe('Qna', () => {
  describe('loadQuestions()', () => {
    it('should load questions empty', async () => {
      const realtimeAPIInstanceMock = {
        fetchQnaUserReactions: () => {
          return Promise.resolve([]);
        },
        fetchAllQnaQuestions: () => {
          return Promise.resolve([]);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const questions = await qna.loadQuestions(10);

      expect(questions).toEqual([]);
    });

    it('should load 5 questions', async () => {
      const realtimeAPIInstanceMock = {
        fetchQnaUserReactions: () => {
          return Promise.resolve([]);
        },
        fetchAllQnaQuestions: () => {
          const questions: QnaQuestion[] = new Array(5).fill(exampleQnaQuestion);

          return Promise.resolve(questions);
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const questions = await qna.loadQuestions(10);

      expect(questions.length).toEqual(5);
    });

    it('should receive an error', async () => {
      const realtimeAPIInstanceMock = {
        fetchAllQnaQuestions: () => {
          return Promise.reject('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      try {
        await qna.loadQuestions(10);
      } catch (e) {
        expect(e.message).toEqual(`Cannot load questions on "fake-qna" Q&A.`);
      }
    });
  });

  describe('onQuestionReceived()', () => {
    it('should receive a question', (done) => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'added',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.onQuestionReceived((question: QnaQuestion) => {
        expect(question.key).toEqual('fake-qna-question');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      try {
        qna.onQuestionReceived((question: QnaQuestion) => {
          console.log({ question });
        });
      } catch (e) {
        expect(e.message).toEqual('Cannot watch new questions on "fake-qna" Q&A.');
      }
    });
  });

  describe('offQuestionReceived()', () => {
    it('should stop listening question received', () => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'added',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      qna.onQuestionReceived(() => {});
      qna.offQuestionReceived();
    });
  });

  describe('onQuestionModified()', () => {
    it('should receive a question modified', (done) => {
      const realtimeAPIInstanceMock = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        listenToQnaUserReactions: () => {},
        listenToQuestionReceived: (callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'modified',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.onQuestionModified((question: QnaQuestion) => {
        expect(question.key).toEqual('fake-qna-question');
        expect(question.changeType).toEqual('modified');
        done();
      });
    });
  });

  describe('offQuestionReceived()', () => {
    it('should stop listening question modified', () => {
      const realtimeAPIInstanceMock = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        listenToQnaUserReactions: () => {},
        listenToQuestionReceived: (callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'modified',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleQuestionModified = () => {};

      qna.onQuestionModified(handleQuestionModified);

      qna.offQuestionModified();
    });
  });

  describe('onQuestionDeleted()', () => {
    it('should receive a question deleted', (done) => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'removed',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.onQuestionDeleted((question: QnaQuestion) => {
        expect(question.key).toEqual('fake-qna-question');
        expect(question.changeType).toEqual('removed');
        done();
      });
    });

    it('should receive an error', () => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: () => {
          throw new Error('invalid');
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      try {
        qna.onQuestionDeleted((question: QnaQuestion) => {
          console.log({ question });
        });
      } catch (e) {
        expect(e.message).toEqual(`Cannot watch deleted questions on "fake-qna" Q&A.`);
      }
    });
  });

  describe('offQuestionDeleted()', () => {
    it('should receive a question deleted', () => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'removed',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.mockImplementation(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      qna.onQuestionDeleted(() => {});
      qna.offQuestionDeleted();
    });
  });

  describe('answerQuestion()', () => {
    it('should store an answered question', async () => {
      const graphQLAPIInstanceMock = {
        answerQuestion: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const result = await qna.answerQuestion(exampleQnaQuestion, 'hey?');

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        answerQuestion: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.answerQuestion(exampleQnaQuestion, 'hey?').catch((error) => {
        expect(error.message).toEqual('Cannot add answer the "fake-qna-question" question.');
        done();
      });
    });
  });

  describe('deleteQuestion()', () => {
    it('should delete a specific question', async () => {
      const graphQLAPIInstanceMock = {
        deleteQuestion: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const result = await qna.deleteQuestion(exampleQnaQuestion);

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        deleteQuestion: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.deleteQuestion(exampleQnaQuestion).catch((error) => {
        expect(error.message).toEqual('Cannot delete the "fake-qna-question" question.');
        done();
      });
    });
  });

  describe('upvoteQuestion()', () => {
    it('should upvote a Q&A question from external user', async () => {
      const graphQLAPIInstanceMock = {
        upvoteQuestion: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const result = await qna.upvoteQuestion(exampleQnaQuestion);

      expect(result).toBe(true);
    });

    it('should upvote a Q&A question from anonymous user', async () => {
      const graphQLAPIInstanceMock = {
        upvoteQuestion: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const exampleSDK = new ArenaChat('my-api-key');
      exampleSDK.site = exampleSite;

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const result = await qna.upvoteQuestion(exampleQnaQuestion, 'fake-anonymous-user');

      expect(result).toBe(true);
    });

    it('should not upvote a Q&A question with a user', (done) => {
      const graphQLAPIInstanceMock = {
        upvoteQuestion: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const exampleSDK = new ArenaChat('my-api-key');
      exampleSDK.site = exampleSite;

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.upvoteQuestion(exampleQnaQuestion).catch((error) => {
        expect(error.message).toEqual('Cannot ban user without anonymoud id or user id.');
        done();
      });
    });

    it('should return an exception', (done) => {
      const graphQLAPIInstanceMock = {
        upvoteQuestion: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const exampleSDK = new ArenaChat('my-api-key');
      exampleSDK.site = exampleSite;

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.upvoteQuestion(exampleQnaQuestion, 'fake-anonymous-user').catch((error) => {
        expect(error.message).toEqual('Cannot upvote to the "fake-qna-question" question.');
        done();
      });
    });
  });

  describe('banUser()', () => {
    it('should ban a anonymous user', async () => {
      const graphQLAPIInstanceMock = {
        banUser: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const result = await qna.banUser({ anonymousId: 'fake-anonymous-user' });

      expect(result).toBe(true);
    });

    it('should ban a external user', async () => {
      const graphQLAPIInstanceMock = {
        banUser: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      const result = await qna.banUser({ userId: 'fake-user' });

      expect(result).toBe(true);
    });

    it('should not ban without a user', (done) => {
      const graphQLAPIInstanceMock = {
        banUser: async () => {
          return true;
        },
      };

      // @ts-ignore
      GraphQLAPI.GraphQLAPI.mockImplementation(() => {
        return graphQLAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna', exampleSite, exampleSDK);

      qna.banUser({}).catch((error) => {
        expect(error.message).toEqual('Cannot ban user without anonymoud id or user id.');
        done();
      });
    });
  });
});
