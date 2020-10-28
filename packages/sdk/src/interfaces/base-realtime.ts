import { ChatMessage, ChatRoom, ExternalUser, ServerReaction, GroupChannel } from '@arena-im/chat-types';
import { QnaQuestion, QnaQuestionFilter } from '@arena-im/chat-types/dist/qna';

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
  listenToChatConfigChanges(channelId: string, callback: (chatRoom: ChatRoom) => void): void;

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

  /**
   * Send a reaction on a message
   *
   * @param reaction a chat message reaction
   */
  sendReaction(reaction: ServerReaction): Promise<ServerReaction>;

  /**
   * Listen to user reactions
   *
   * @param user external user
   * @param callback callback that will receive the reactions
   */
  listenToUserReactions(user: ExternalUser, callback: (reaction: ServerReaction[]) => void): () => void;

  /**
   * Listen to Q&A user reactions
   *
   * @param user external user
   * @param qnaId Q&A id
   * @param callback
   */
  listenToQnaUserReactions(userId: string, qnaId: string, callback: (reaction: ServerReaction[]) => void): () => void;

  /**
   * Listen to user group channels change
   *
   * @param user external user
   */
  listenToUserGroupChannels(user: ExternalUser, callback: (groupChannels: GroupChannel[]) => void): () => void;

  /**
   * Fetch all q&a questions
   *
   * @param qnaId
   * @param limit
   * @param filter
   */
  fetchAllQnaQuestions(qnaId: string, limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]>;

  /**
   * Fetch all q&a reactions
   *
   * @param userId
   * @param qnaId
   */
  fetchQnaUserReactions(userId: string, qnaId: string): Promise<ServerReaction[]>;
}
