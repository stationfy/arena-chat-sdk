import { ChatMessage, ChatMessageContent } from './chat-message';
import { PublicUser } from './user';

export interface GroupChannel {
  _id: string;
  createdAt?: number;
  image?: string;
  lastClearedTimestamp?: number;
  lastMessage?: ChatMessage;
  lastReadTimestamp?: number;
  members?: PublicUser[];
  name?: string;
  unreadCount?: number;
  amIBlocked: boolean;
}

export enum PublicUserStatus {
  ONLINE = 'ONLINE',
  OFFLINE = 'OFFLINE',
}

export interface PrivateMessageInput {
  groupChannelId: string;
  message: ChatMessageContent;
  replyTo?: string;
}
