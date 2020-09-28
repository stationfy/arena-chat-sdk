import { BaseQna, Site, QnaQuestionFilter, QnaQuestion, DocumentChangeType } from '@arena-im/chat-types';
import { GraphQLAPI } from '../services/graphql-api';
import { RealtimeAPI } from '../services/realtime-api';
import { ArenaChat } from '../sdk';

export class Qna implements BaseQna {
  private graphQLAPI: GraphQLAPI;
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentQuestions: QnaQuestion[] = [];
  private questionModificationCallbacks: { [type: string]: ((question: QnaQuestion) => void)[] } = {};
  private questionModificationListener: (() => void) | null = null;

  public constructor(private qnaId: string, site: Site, private sdk: ArenaChat) {
    this.realtimeAPI = new RealtimeAPI(qnaId);
    this.graphQLAPI = new GraphQLAPI(site, this.sdk.user || undefined);
  }

  public async loadQuestions(limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]> {
    try {
      const questions = await this.realtimeAPI.fetchAllQnaQuestions(this.qnaId, limit, filter);

      this.updateCacheCurrentQuestions(questions);

      return questions;
    } catch (e) {
      throw new Error(`Cannot load questions on "${this.qnaId}" Q&A.`);
    }
  }

  public onQuestionReceived(callback: (question: QnaQuestion) => void): void {
    try {
      this.registerQuestionModificationCallback((newQuestion) => {
        if (this.cacheCurrentQuestions.some((question) => newQuestion.key === question.key)) {
          return;
        }

        const messages = [...this.cacheCurrentQuestions, newQuestion];

        this.updateCacheCurrentQuestions(messages);

        callback(newQuestion);
      }, DocumentChangeType.ADDED);
    } catch (e) {
      throw new Error(`Cannot watch new questions on "${this.qnaId}" Q&A.`);
    }
  }

  public offQuestionReceived(): void {
    this.questionModificationCallbacks[DocumentChangeType.ADDED] = [];
  }

  public onQuestionModified(callback: (question: QnaQuestion) => void): void {
    try {
      this.registerQuestionModificationCallback((modifiedQuestion) => {
        const questions = this.cacheCurrentQuestions.map((question) => {
          return question;
        });

        this.updateCacheCurrentQuestions(questions);

        callback(modifiedQuestion);
      }, DocumentChangeType.MODIFIED);
    } catch (e) {
      throw new Error(`Cannot watch questions modified on "${this.qnaId}" Q&A.`);
    }
  }

  public offQuestionModified(): void {
    this.questionModificationCallbacks[DocumentChangeType.MODIFIED] = [];
  }

  public onQuestionDeleted(callback: (question: QnaQuestion) => void): void {
    try {
      this.registerQuestionModificationCallback((question) => {
        const questions = this.cacheCurrentQuestions.filter((item) => item.key !== question.key);

        this.updateCacheCurrentQuestions(questions);

        callback(question);
      }, DocumentChangeType.REMOVED);
    } catch (e) {
      throw new Error(`Cannot watch deleted questions on "${this.qnaId}" Q&A.`);
    }
  }

  public offQuestionDeleted(): void {
    this.questionModificationCallbacks[DocumentChangeType.REMOVED] = [];
  }

  public async addQuestion(text: string): Promise<string> {
    try {
      const result = await this.graphQLAPI.addQuestion(this.qnaId, text);

      return result;
    } catch (e) {
      throw new Error(`Cannot add question to the "${this.qnaId}" Q&A.`);
    }
  }

  public async answerQuestion(question: QnaQuestion, text: string): Promise<boolean> {
    try {
      const result = await this.graphQLAPI.answerQuestion(this.qnaId, question.key, text);

      return result;
    } catch (e) {
      throw new Error(`Cannot add answer the "${question.key}" question.`);
    }
  }

  public async deleteQuestion(question: QnaQuestion): Promise<boolean> {
    try {
      const result = await this.graphQLAPI.deleteQuestion(this.qnaId, question.key);

      return result;
    } catch (e) {
      throw new Error(`Cannot delete the "${question.key}" question.`);
    }
  }

  public async upvoteQuestion(question: QnaQuestion, anonymousId?: string): Promise<boolean> {
    let userId = anonymousId;

    if (this.sdk.user) {
      userId = this.sdk.user.id;
    }

    if (typeof userId === 'undefined') {
      throw new Error('Cannot ban user without anonymoud id or user id.');
    }

    try {
      const result = await this.graphQLAPI.upvoteQuestion(this.qnaId, question.key, userId);

      return result;
    } catch (e) {
      throw new Error(`Cannot upvote to the "${question.key}" question.`);
    }
  }

  public async banUser({ anonymousId, userId }: { anonymousId?: string; userId?: string }): Promise<boolean> {
    if (!anonymousId && !userId) {
      throw new Error('Cannot ban user without anonymoud id or user id.');
    }

    try {
      const result = await this.graphQLAPI.banUser({ anonymousId, userId });

      return result;
    } catch (e) {
      throw new Error(`Cannot ban the user "${anonymousId || userId}"`);
    }
  }

  /**
   * Register message modification callback
   *
   */
  private registerQuestionModificationCallback(callback: (question: QnaQuestion) => void, type: DocumentChangeType) {
    if (!this.questionModificationCallbacks[type]) {
      this.questionModificationCallbacks[type] = [];
    }

    this.questionModificationCallbacks[type].push(callback);

    this.listenToAllTypeQuestionModification();
  }

  /**
   * Update the cache of current questions
   *
   * @param questions
   */
  private updateCacheCurrentQuestions(questions: QnaQuestion[]): void {
    this.cacheCurrentQuestions = questions;
  }

  /**
   * Listen to all type message modification
   *
   */
  private listenToAllTypeQuestionModification() {
    if (this.questionModificationListener !== null) {
      return;
    }

    this.questionModificationListener = this.realtimeAPI.listenToQuestionReceived((question) => {
      if (question.changeType === undefined || !this.questionModificationCallbacks[question.changeType]) {
        return;
      }

      this.questionModificationCallbacks[question.changeType].forEach((callback) => callback(question));
    });
  }
}
