import { ChatMessage } from '@arena-im/chat-types';

export interface IListMessages {
  messages: ChatMessage[];
}

export enum MessageType {
  POLL = 'POLL_PUBLISHED',
}
