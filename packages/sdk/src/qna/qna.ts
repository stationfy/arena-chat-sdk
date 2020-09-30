import {
  BaseQna,
  Site,
  QnaQuestionFilter,
  QnaQuestion,
  DocumentChangeType,
  ServerReaction,
  ExternalUser,
} from '@arena-im/chat-types';
import { GraphQLAPI } from '../services/graphql-api';
import { RealtimeAPI } from '../services/realtime-api';
import { ArenaChat } from '../sdk';

export class Qna implements BaseQna {
  private graphQLAPI: GraphQLAPI;
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentQuestions: QnaQuestion[] = [];
  private questionModificationCallbacks: { [type: string]: ((question: QnaQuestion) => void)[] } = {};
  private questionModificationListener: (() => void) | null = null;
  private userReactionsSubscription: (() => void) | null = null;
  private cacheCurrentUserReactions: { [key: string]: ServerReaction } = {};

  public constructor(private qnaId: string, private site: Site, private sdk: ArenaChat) {
    this.realtimeAPI = new RealtimeAPI(qnaId);
    this.graphQLAPI = new GraphQLAPI(site, this.sdk.user || undefined);

    this.sdk.onUserChanged((user: ExternalUser) => this.watchUserChanged(user));
  }

  /**
   * Watch user changed
   *
   * @param {ExternalUser} user external user
   */
  private watchUserChanged(user: ExternalUser) {
    this.cleanQuestionsReaction();
    this.watchUserReactions(user);

    this.graphQLAPI = new GraphQLAPI(this.site, user || undefined);
  }

  public async loadQuestions(limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]> {
    try {
      const questions = await this.realtimeAPI.fetchAllQnaQuestions(this.qnaId, limit, filter);

      this.updateCacheCurrentQuestions(questions);

      const reactions = await this.getUserReactions();

      if (reactions) {
        reactions.forEach((reaction) => {
          this.cacheCurrentUserReactions[reaction.itemId] = reaction;
        });

        this.updateAndNotifyQuestionReaction();
      }

      return this.cacheCurrentQuestions;
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
      this.watchUserReactions();
      this.registerQuestionModificationCallback((modifiedQuestion) => {
        if (this.cacheCurrentUserReactions[modifiedQuestion.key]) {
          modifiedQuestion.userVoted = true;
        }

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

  private async getUserReactions(): Promise<ServerReaction[] | void> {
    if (typeof this.sdk.user?.id === 'undefined') {
      return;
    }

    return this.realtimeAPI.fetchQnaUserReactions(this.sdk.user.id, this.qnaId);
  }

  /**
   * Watch user reactions
   *
   * @param user external user
   */
  private watchUserReactions(user = this.sdk.user): void {
    if (typeof user?.id === 'undefined') {
      return;
    }

    if (this.userReactionsSubscription !== null) {
      this.userReactionsSubscription();
    }

    try {
      this.userReactionsSubscription = this.realtimeAPI.listenToQnaUserReactions(user.id, this.qnaId, (reactions) => {
        reactions.forEach((reaction) => {
          this.cacheCurrentUserReactions[reaction.itemId] = reaction;
        });

        this.updateAndNotifyQuestionReaction();
      });
    } catch (e) {
      throw new Error('Cannot listen to user reactions');
    }
  }

  private cleanQuestionsReaction() {
    this.cacheCurrentQuestions.forEach((question) => {
      if (question.userVoted) {
        question.userVoted = false;
        if (this.questionModificationCallbacks['modified']) {
          this.questionModificationCallbacks['modified'].forEach((callback) => callback(question));
        }
      }
    });
  }

  private updateAndNotifyQuestionReaction() {
    this.cacheCurrentQuestions.forEach((question) => {
      if (this.cacheCurrentUserReactions[question.key] && !question.userVoted) {
        question.userVoted = true;

        if (this.questionModificationCallbacks['modified']) {
          this.questionModificationCallbacks['modified'].forEach((callback) => callback(question));
        }
      }
    });
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
