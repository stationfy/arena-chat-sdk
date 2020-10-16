import { ChatMessage, ChatMessageContent } from './chat-message';

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

export interface PublicUser {
  _id: string;
  defaultImage?: boolean;
  groupChannels?: GroupChannel[];
  image?: string;
  isModerator?: boolean;
  name: string;
  status: PublicUserStatus;
  totalGroupChannelUnreadCount?: number;
  modLabel?: string;
  isBanned?: boolean;
  isBlocked?: boolean;
}

export interface PrivateMessageInput {
  groupChannelId: string;
  message: ChatMessageContent;
  replyTo?: string;
  tempId?: string;
}
