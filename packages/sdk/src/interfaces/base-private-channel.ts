import { ChatMessage } from '@arena-im/chat-types';

export interface BasePrivateChannel {
  loadRecentMessages(limit?: number): Promise<ChatMessage[]>;
  loadPreviousMessages(limit?: number): Promise<ChatMessage[]>;
  offMessageReceived(): void;
  onMessageReceived(callback: (message: ChatMessage) => void): void;
}
