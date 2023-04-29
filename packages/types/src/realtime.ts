import { ChatMessage } from './chat-message';

export interface BaseRealtimeAPI {
  close(): void;
  fetchRecentMessages(limit: number): Promise<ChatMessage[]>;
  fetchPreviousMessages(limit: number, before: number): Promise<ChatMessage[]>;
  listenToMessage(callback: (message: ChatMessage) => void): () => void;
}
