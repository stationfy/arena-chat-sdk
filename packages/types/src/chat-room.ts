import { ChatMessage, ChatMessageSender, MessageReaction } from './chat-message';
import { Moderation } from './moderation';
import { BasePolls } from './polls';
import { BaseQna } from './qna';
import { PublicUser } from './user';

export interface ChatRoom extends LiveChatChannel {
  chatAutoOpen: boolean;
  chatClosedIsEnabled: boolean;
  chatPreviewEnabled: boolean;
  createdAt: number;
  lang: string;
  language: string;
  presenceId: string;
  profanityFilterType?: string;
  showOnlineUsersNumber: boolean;
  signUpRequired: boolean;
  signUpSettings: SignUpSettings;
  siteId: string;
  slug: string;
  standalone: boolean;
  numChannels: number;
  mainChannel: LiveChatChannel;
  version: string;
}

export interface LiveChatChannel {
  _id: string;
  allowSendGifs: boolean;
  allowShareUrls: boolean;
  chatColor: string;
  chatPreModerationIsEnabled: boolean;
  chatRequestModeratorIsEnabled: boolean;
  dataPath: string;
  hasPolls: boolean;
  name: string;
  qnaId?: string;
  qnaIsEnabled?: boolean;
  reactionsEnabled: boolean;
  showEmojiButton: boolean;
  unreadCount: number;
}

interface SignUpSettings {
  suggest: boolean;
  type: string;
}

export interface ChatModerationRequest {
  siteId: string;
  chatRoomId: string;
}

export interface BaseLiveChat {
  getChannels(): Promise<LiveChatChannel[]>;
  getMainChannel(): BaseChannel;
  getChannel(channelId: string): Promise<BaseChannel>;
  getMembers(): Promise<PublicUser[]>;
}

export interface BaseChannel {
  markReadDebounced: () => void;
  getPollsIntance(userId: string): Promise<BasePolls>;
  banUser(user: ChatMessageSender): Promise<void>;
  deleteMessage(message: ChatMessage): Promise<boolean>;
  requestModeration(): Promise<Moderation>;
  sendMessage({
    text,
    replyTo,
    mediaURL,
    tempId,
  }: {
    text?: string;
    replyTo?: string;
    mediaURL?: string;
    tempId?: string;
  }): Promise<string>;
  loadRecentMessages(limit?: number): Promise<ChatMessage[]>;
  loadPreviousMessages(limit?: number): Promise<ChatMessage[]>;
  sendReaction(reaction: MessageReaction): Promise<MessageReaction>;
  offMessageReceived(): void;
  onMessageReceived(callback: (message: ChatMessage) => void): void;
  offMessageModified(): void;
  onMessageModified(callback: (message: ChatMessage) => void): void;
  offMessageDeleted(): void;
  onMessageDeleted(callback: (message: ChatMessage) => void): void;
  offAllListeners(): void;
  getChatQnaInstance(): Promise<BaseQna>;
  reportMessage(message: ChatMessage, anonymousId?: string): Promise<boolean>;
}
