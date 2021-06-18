import { QnaQuestion } from '@arena-im/chat-types';

export interface IQnaChat {
  qna: QnaQuestion;
  seeAllButton: () => void;
}
