import { ChatMessage } from './chat-message';

/** Realtime used to listen to realtime events */
export interface RealtimeBase {
  /**
   * Listen to the chat messages
   *
   * @param callback Callback function
   */
  listenToMessage(callback: (messages: ChatMessage[]) => void): void;

  /**
   * Listen to chat config changes
   *
   * @param callback Callback function
   */
  listenToChatConfigChanges(callback: Function): void;

  /**
   * Listen to banned users
   *
   * @param callback Callback function
   */
  listenToBannedUsers(callback: Function): void;
}
