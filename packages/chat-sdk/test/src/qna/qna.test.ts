import { Qna } from '@qna/qna';
import { User } from '@arena-im/core';
import { exampleQnaProps, exampleQnaQuestion, exampleUser } from '../../fixtures/examples';
import { GraphQLAPI } from '@services/graphql-api';
import * as RealtimeAPI from '@services/realtime-api';
import { BaseQna, QnaQuestion } from '@arena-im/chat-types';

jest.mock('@services/graphql-api', () => ({
  GraphQLAPI: {
    instance: jest.fn(),
  },
}));

jest.mock('@services/realtime-api', () => ({
  RealtimeAPI: jest.fn(),
}));

jest.mock('@arena-im/core', () => ({
  User: {
    instance: {
      data: jest.fn(),
    },
  },
  UserObservable: {
    instance: {
      onUserChanged: jest.fn(),
    },
  },
}));

describe('Qna', () => {
  beforeAll(() => {
    const realtimeAPIInstanceMock = {};

    // @ts-ignore
    RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
      return realtimeAPIInstanceMock;
    });
  });

  beforeEach(() => {
    // @ts-ignore
    User.instance.data = exampleUser;
  });
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
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

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
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

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
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      try {
        await qna.loadQuestions(10);
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual(`Cannot load questions on "fake-qna" Q&A.`);
      }
    });
  });

  describe('onQuestionReceived()', () => {
    it('should receive a question', (done) => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (_: string, callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'added',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

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
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      try {
        qna.onQuestionReceived((question: QnaQuestion) => {
          console.log({ question });
        });
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual('Cannot watch new questions on "fake-qna" Q&A.');
      }
    });
  });

  describe('offQuestionReceived()', () => {
    it('should stop listening question received', () => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (_: string, callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'added',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

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
        listenToQuestionReceived: (_: string, callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'modified',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.onQuestionModified((question: QnaQuestion) => {
        expect(question.key).toEqual('fake-qna-question');
        expect(question.changeType).toEqual('modified');
        done();
      });
    });
  });

  describe('getQnaProps()', () => {
    it('should get Q&A props from firestore', async () => {
      const realtimeAPIInstanceMock = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        listenToQnaUserReactions: () => {},
        fetchQnaProps: async () => {
          return exampleQnaProps;
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const result = await Qna.getQnaProps('fake-qna-id');

      expect(result).toEqual(exampleQnaProps);
    });
  });

  describe('offQuestionReceived()', () => {
    it('should stop listening question modified', () => {
      const realtimeAPIInstanceMock = {
        // eslint-disable-next-line @typescript-eslint/no-empty-function
        listenToQnaUserReactions: () => {},
        listenToQuestionReceived: (_: string, callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'modified',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      const handleQuestionModified = () => {};

      qna.onQuestionModified(handleQuestionModified);

      qna.offQuestionModified();
    });
  });

  describe('onQuestionDeleted()', () => {
    it('should receive a question deleted', (done) => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (_: string, callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'removed',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

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
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      try {
        qna.onQuestionDeleted((question: QnaQuestion) => {
          console.log({ question });
        });
      } catch (e) {
        // @ts-ignore
        expect(e.message).toEqual(`Cannot watch deleted questions on "fake-qna" Q&A.`);
      }
    });
  });

  describe('offQuestionDeleted()', () => {
    it('should receive a question deleted', () => {
      const realtimeAPIInstanceMock = {
        listenToQuestionReceived: (_: string, callback: (question: QnaQuestion) => void) => {
          callback({
            ...exampleQnaQuestion,
            changeType: 'removed',
          });
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      qna.onQuestionDeleted(() => {});
      qna.offQuestionDeleted();
    });
  });

  describe('answerQuestion()', () => {
    it('should store an answered question', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        answerQuestion: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      const result = await qna.answerQuestion(exampleQnaQuestion, 'hey?');

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        answerQuestion: async () => {
          throw new Error('failed');
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.answerQuestion(exampleQnaQuestion, 'hey?').catch((error) => {
        expect(error.message).toEqual('Cannot add answer the "fake-qna-question" question.');
        done();
      });
    });
  });

  describe('deleteQuestion()', () => {
    it('should delete a specific question', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deleteQuestion: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      const result = await qna.deleteQuestion(exampleQnaQuestion);

      expect(result).toBe(true);
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        deleteQuestion: async () => {
          throw new Error('failed');
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.deleteQuestion(exampleQnaQuestion).catch((error) => {
        expect(error.message).toEqual('Cannot delete the "fake-qna-question" question.');
        done();
      });
    });
  });

  describe('upvoteQuestion()', () => {
    it('should upvote a Q&A question from external user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        upvoteQuestion: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      const result = await qna.upvoteQuestion(exampleQnaQuestion);

      expect(result).toBe(true);
    });

    it('should upvote a Q&A question from anonymous user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        upvoteQuestion: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      const result = await qna.upvoteQuestion(exampleQnaQuestion, 'fake-anonymous-user');

      expect(result).toBe(true);
    });

    it('should not upvote a Q&A question with a user', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        upvoteQuestion: async () => {
          return true;
        },
      };

      User.instance.data = null;

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.upvoteQuestion(exampleQnaQuestion).catch((error) => {
        expect(error.message).toEqual('Cannot ban user without anonymoud id or user id.');
        done();
      });
    });

    it('should return an exception', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        upvoteQuestion: async () => {
          throw new Error('failed');
        },
      };

      // @ts-ignore
      User.instance.data = exampleUser;

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.upvoteQuestion(exampleQnaQuestion, 'fake-anonymous-user').catch((error) => {
        expect(error.message).toEqual('Cannot upvote to the "fake-qna-question" question.');
        done();
      });
    });
  });

  describe('banUser()', () => {
    it('should ban a anonymous user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        banUser: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      const result = await qna.banUser({ anonymousId: 'fake-anonymous-user' });

      expect(result).toBe(true);
    });

    it('should ban a external user', async () => {
      // @ts-ignore
      GraphQLAPI.instance = {
        banUser: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      const result = await qna.banUser({ userId: 'fake-user' });

      expect(result).toBe(true);
    });

    it('should not ban without a user', (done) => {
      // @ts-ignore
      GraphQLAPI.instance = {
        banUser: async () => {
          return true;
        },
      };

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.banUser({}).catch((error) => {
        expect(error.message).toEqual('Cannot ban user without anonymoud id or user id.');
        done();
      });
    });
  });

  describe('offChange()', () => {
    it('should call the unsubscribe function', (done) => {
      const realtimeAPIInstanceMock = {
        listenToQnaProps: (_: string, callback: (instance: BaseQna) => void) => {
          callback(new Qna(exampleQnaProps, 'fake-qna'));

          // eslint-disable-next-line @typescript-eslint/no-empty-function
          return () => {};
        },
      };

      // @ts-ignore
      RealtimeAPI.RealtimeAPI.getInstance = jest.fn(() => {
        return realtimeAPIInstanceMock;
      });

      const qna = new Qna(exampleQnaProps, 'fake-qna');

      // eslint-disable-next-line @typescript-eslint/no-empty-function
      qna.onChange(() => {});

      qna.offChange((success) => {
        expect(success).toBe(true);
        done();
      });
    });

    it('should not call the unsubscribe function when there is any listener', (done) => {
      const qna = new Qna(exampleQnaProps, 'fake-qna');

      qna.offChange((success) => {
        expect(success).toBe(false);
        done();
      });
    });
  });
});
