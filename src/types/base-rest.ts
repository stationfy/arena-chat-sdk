import { ChatMessage, ChatMessageReport } from './chat-message';
import { BanUser } from './user';

/** Rest api used to consume the rest services */
export interface BaseRest {
  /**
   * Send chat message
   *
   * @param message chat message
   */
  sendMessage(message: ChatMessage): PromiseLike<ChatMessage>;

  /**
   * Report a chat message
   *
   * @param report report payload
   */
  reportMessage(report: ChatMessageReport): PromiseLike<ChatMessageReport>;

  /** User request moderation role */
  requestModeration(): PromiseLike<void>;

  /**
   * Ban a user
   *
   * @param barUser User to be banned
   */
  banUser(banUser: BanUser): PromiseLike<void>;

  /**
   * Delete a chat message
   *
   * @param message Message to be deleted
   */
  deleteMessage(message: ChatMessage): PromiseLike<void>;
}
