import { ChatMessage, ChatRoom } from '@arena-im/chat-types';

/** Realtime used to listen to realtime events */
export interface BaseRealtime {
  /**
   * Listen to the chat messages
   *
   * @param callback Callback function
   */
  listenToMessage(callback: (messages: ChatMessage[]) => void, limit?: number): void;

  /**
   * Listen to chat config changes
   *
   * @param callback Callback function
   */
  listenToChatConfigChanges(callback: (chatRoom: ChatRoom) => void): void;

  /**
   * Listen to banned users
   *
   * @param callback Callback function
   */
  listenToBannedUsers(callback: () => void): void;

  /**
   * Fetch recent chat messages
   *
   * @param limit maximum number of messages
   */
  fetchRecentMessages(limit?: number): Promise<ChatMessage[]>;

  /**
   * Fetch previous chat messages
   *
   * @param callback maximum number of messages
   */
  fetchPreviousMessages(firstMessage: ChatMessage, limit?: number): Promise<ChatMessage[]>;

  /**
   * Listen to chat new message
   *
   * @param callback callback that expect a chat message
   */
  listenToMessageReceived(callback: (message: ChatMessage) => void): () => void;
}
