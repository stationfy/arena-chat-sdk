import { ChatMessage, ChatMessageContent } from './chat-message';

export interface BasePrivateChannel {
  loadRecentMessages(limit?: number): Promise<ChatMessage[]>;
  loadPreviousMessages(limit?: number): Promise<ChatMessage[]>;
  offMessageReceived(): void;
  onMessageReceived(callback: (message: ChatMessage) => void): void;
  sendMessage(message: ChatMessageContent): Promise<string>;
}
