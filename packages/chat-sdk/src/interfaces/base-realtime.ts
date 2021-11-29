import {
  ChatMessage,
  ExternalUser,
  ServerReaction,
  GroupChannel,
  LiveChatChannel,
  PollFilter,
  Poll,
  QnaProps,
  QnaQuestion,
  QnaQuestionFilter,
} from '@arena-im/chat-types';

/** Realtime used to listen to realtime events */
export interface BaseRealtime {
  /**
   * Listen to the chat messages
   *
   * @param callback Callback function
   */
  listenToMessage(channelId: string, callback: (messages: ChatMessage[]) => void, limit?: number): void;

  /**
   * Listen to chat config changes
   *
   * @param callback Callback function
   */
  listenToChatConfigChanges(path: string, callback: (channel: LiveChatChannel) => void): () => void;

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
  fetchRecentMessages(dataPath: string, limit?: number): Promise<ChatMessage[]>;

  /**
   * Fetch previous chat messages
   *
   * @param callback maximum number of messages
   */
  fetchPreviousMessages(dataPath: string, firstMessage: ChatMessage, limit?: number): Promise<ChatMessage[]>;

  /**
   * Listen to chat new message
   *
   * @param callback callback that expect a chat message
   */
  listenToMessageReceived(dataPath: string, callback: (message: ChatMessage) => void): () => void;

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

  /**
   * Feach all chat polls
   *
   * @param channelId
   * @param filter filter by category: POPULAR, ACTIVE, ENDED
   * @param limit
   */
  fetchAllPolls(channelId: string, filter?: PollFilter, limit?: number): Promise<Poll[]>;

  /**
   * Unsubscribe to all listener
   */
  unsubscribeAll(): void;

  /**
   * Fetch recent messages on chat group
   *
   * @param channelId
   * @param limit
   * @param lastClearedTimestamp
   */
  fetchGroupRecentMessages(channelId: string, limit?: number, lastClearedTimestamp?: number): Promise<ChatMessage[]>;

  /**
   * Fetch previous messages on chat group
   *
   * @param channelId
   * @param firstMessage
   * @param lastClearedTimestamp
   * @param limit
   */
  fetchGroupPreviousMessages(
    channelId: string,
    firstMessage: ChatMessage,
    lastClearedTimestamp?: number,
    limit?: number,
  ): Promise<ChatMessage[]>;

  /**
   * Listen to Q&A questions
   *
   * @param channelId
   * @param callback
   */
  listenToQuestionReceived(channelId: string, callback: (message: QnaQuestion) => void): () => void;

  /**
   * Listen to polls on channel
   *
   * @param channelId
   * @param callback
   */
  listenToPollReceived(channelId: string, callback: (poll: Poll) => void): () => void;

  /**
   * Listen to group chat messages
   *
   * @param channelId
   * @param callback
   */
  listenToGroupMessageReceived(channelId: string, callback: (message: ChatMessage) => void): () => void;

  /**
   * Listen to user reactions on polls
   *
   * @param channelId
   * @param userId
   * @param callback
   */
  listenToUserChatPollsReactions(
    channelId: string,
    userId: string,
    callback: (reactions: ServerReaction[]) => void,
  ): () => void;

  /**
   * Fetch Q&A propperties
   *
   * @param qnaId
   */
  fetchQnaProps(qnaId: string): Promise<QnaProps>;

  /**
   * Listen to modified Q&A properties
   *
   * @param qnaId
   * @param callback
   */
  listenToQnaProps(qnaId: string, callback: (props: QnaProps) => void): () => void;
}
