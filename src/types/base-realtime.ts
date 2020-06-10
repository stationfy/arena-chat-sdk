import { ChatMessage } from './chat-message';

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
  listenToChatConfigChanges(callback: () => void): void;

  /**
   * Listen to banned users
   *
   * @param callback Callback function
   */
  listenToBannedUsers(callback: () => void): void;
}
