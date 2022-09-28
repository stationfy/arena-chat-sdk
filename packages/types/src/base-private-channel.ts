import { ChatMessage, ChatMessageContent } from './chat-message';
import { GroupChannel } from './private-chat';

interface BasePrivateChannel {
  loadRecentMessages(limit?: number): Promise<ChatMessage[]>;
  loadPreviousMessages(limit?: number): Promise<ChatMessage[]>;
  offMessageReceived(): void;
  onMessageDeleted(callback: (message: ChatMessage) => void): void;
  offMessageModified(): void;
  offMessageDeleted(): void;
  onMessageReceived(callback: (message: ChatMessage) => void): void;
  onMessageModified(callback: (message: ChatMessage) => void): void;
  offAllListeners(): void;
  markReadDebounced: () => void;
  markRead(): Promise<boolean>;
  deleteMessage(messageId: string): Promise<boolean>;
  removeAllMessages(): Promise<boolean>;
  sendMessage(message: ChatMessageContent, replyMessageId?: string, tempId?: string): Promise<string>;
}

export interface BasePrivateChannelStatic {
  new (groupChannel: GroupChannel): BasePrivateChannel;
  onUnreadMessagesCountChanged(callback: (total: number) => void): () => void;
  getUserChannels(): Promise<GroupChannel[]>;
  getGroupChannel(id: string): Promise<GroupChannel>;
}
