import { PublicUser } from './user';

export interface BaseQna extends QnaProps {
  loadQuestions(limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]>;
  onChange(callback: (instance: BaseQna) => void): void;
  offChange(callback: (success: boolean) => void): void;
  onQuestionReceived(callback: (question: QnaQuestion) => void): void;
  offQuestionReceived(): void;
  onQuestionModified(callback: (question: QnaQuestion) => void): void;
  offQuestionModified(): void;
  onQuestionDeleted(callback: (question: QnaQuestion) => void): void;
  offQuestionDeleted(): void;
  addQuestion(text: string): Promise<string>;
  answerQuestion(question: QnaQuestion, text: string): Promise<boolean>;
  deleteQuestion(question: QnaQuestion): Promise<boolean>;
  upvoteQuestion(question: QnaQuestion, anonymousId?: string): Promise<boolean>;
  banUser({ anonymousId, userId }: { anonymousId?: string; userId?: string }): Promise<boolean>;
}

export interface QnaProps {
  preModeration: boolean;
  language: string;
  status: string;
  updatedAt: number;
  createdAt: number;
  createdBy: string;
  name: string;
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
  answer: {
    sender: PublicUser;
    text: string;
  };
  userVoted: boolean;
}
