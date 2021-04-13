import { ChatMessage } from '@arena-im/chat-types';

export interface IListMessages {
  messages: ChatMessage[];
  seeAllQna: () => void;
  seeAllPoll: () => void;
}

export enum MessageType {
  POLL = 'POLL_PUBLISHED',
  QNA = 'QNA_QUESTION_ANSWER',
}
