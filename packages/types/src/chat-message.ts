export interface ChatMessage {
  createdAt?: number;
  key?: string;
  message: ChatMessageContent;
  publisherId?: string;
  referer?: string;
  replyMessage?: ChatMessage;
  sender?: ChatMessageSender;
  changeType?: string;
  reactions?: ChatMessageReaction;
  currentUserReactions?: ChatMessageCurrentUserReactions;
  groupChannelId?: string;
  openChannelId?: string;
  tempId?: string;
  replyTo?: string;
}

interface ChatMessageReaction {
  [type: string]: number;
}

interface ChatMessageCurrentUserReactions {
  [type: string]: boolean;
}

export enum MessageChangeType {
  ADDED = 'added',
  REMOVED = 'removed',
  MODIFIED = 'modified',
}

export interface ChatMessageSender {
  anonymousId?: string;
  label?: string;
  uid?: string;
  displayName?: string;
  photoURL?: string;
  isPublisher?: boolean;
  _id?: string;
  name?: string;
  image?: string;
}

export interface ChatMessageContent {
  text?: string;
  media?: ChatMessageContentMedia;
}

export interface ChatMessageContentMedia {
  url: string;
  description?: string;
  html?: string;
  isGif?: boolean;
  providerName?: string;
  providerUrl?: string;
  thumbnailHeight?: number;
  thumbnailUrl?: string;
  thumbnailWidth?: number;
  title?: string;
  type?: string;
}

export interface ChatMessageReport {
  message: ChatMessage;
  reportedBy: ChatMessageReportedBy;
  key: string;
  type: string;
}

export interface ChatMessageReportedBy {
  reportedByType: string;
  uid?: string;
  displayName?: string;
  image?: string;
}

export interface DeleteChatMessageRequest {
  siteId: string;
}

export interface ServerReaction {
  itemType: string;
  reaction: string;
  publisherId: string;
  itemId: string;
  chatRoomId?: string;
  userId: string;
  key?: string;
  openChannelId?: string;
  chatRoomVersion?: string;
  isDashboardUser?: boolean;
}

export interface MessageReaction {
  id?: string;
  messageID: string;
  type: string;
}
