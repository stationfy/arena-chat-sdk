export interface ChatMessage {
  createdAt?: number;
  key?: string;
  message: ChatMessageContent;
  publisherId: string;
  referer?: string;
  replyMessage?: ChatMessage;
  sender: ChatMessageSender;
  changeType?: string;
  reactions?: ChatMessageReaction;
  currentUserReactions?: ChatMessageCurrentUserReactions;
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
  displayName: string;
  photoURL: string;
  isPublisher?: boolean;
}

export interface ChatMessageContent {
  text?: string;
  media?: ChatMessageContentMedia;
}

export interface ChatMessageContentMedia {
  url: string;
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
}

export interface DeleteChatMessageRequest {
  siteId: string;
}

export interface ServerReaction {
  itemType: string;
  reaction: string;
  publisherId: string;
  itemId: string;
  chatRoomId: string;
  userId: string;
  key?: string;
}

export interface MessageReaction {
  id?: string;
  messageID: string;
  type: string;
}
