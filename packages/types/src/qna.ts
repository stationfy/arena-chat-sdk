import { PublicUser } from './user';

export interface BaseQna {
  loadQuestions(limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]>;
  onQuestionReceived(callback: (question: QnaQuestion) => void): void;
  offQuestionReceived(): void;
  onQuestionModified(callback: (question: QnaQuestion) => void): void;
  offQuestionModified(): void;
  onQuestionDeleted(callback: (question: QnaQuestion) => void): void;
  offQuestionDeleted(): void;
  addQuestion(text: string): Promise<string>;
  answerQuestion(question: QnaQuestion, text: string): Promise<boolean>;
  deleteQuestion(question: QnaQuestion): Promise<boolean>;
  upvoteQuestion(question: QnaQuestion): Promise<boolean>;
  banUser({ anonymousId, userId }: { anonymousId?: string; userId?: string }): Promise<boolean>;
}

export enum QnaQuestionFilter {
  POPULAR = 'popular',
  RECENT = 'recent',
}

export interface QnaQuestion {
  createdAt: number;
  isAnswered: boolean;
  key: string;
  sender: PublicUser;
  text: string;
  upvotes: number;
  changeType?: string;
}

export enum DocumentChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
}
