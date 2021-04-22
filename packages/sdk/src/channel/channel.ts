import {
  ChatMessage,
  MessageChangeType,
  ServerReaction,
  MessageReaction,
  ExternalUser,
  BanUser,
  ChatMessageSender,
  BasePolls,
  LiveChatChannel,
  Moderation,
  BaseChannel,
  BaseQna,
  ChatMessageReportedBy,
  ChatRoom,
  ChannelMessageReactions,
  BaseReaction,
} from '@arena-im/chat-types';
import { RealtimeAPI } from '../services/realtime-api';
import { ArenaChat } from '../sdk';
import { GraphQLAPI } from '../services/graphql-api';
import { debounce } from '../utils/misc';
import { Reaction } from '../reaction/reaction';
import { RestAPI } from '../services/rest-api';

export class Channel implements BaseChannel {
  private static instances: { [key: string]: Channel } = {};
  private graphQLAPI: GraphQLAPI;
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentMessages: ChatMessage[] = [];
  private cacheUserReactions: { [key: string]: ServerReaction[] } = {};
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListener: (() => void) | null = null;
  private userReactionsSubscription: (() => void) | null = null;
  public markReadDebounced: () => void;
  public polls: BasePolls | null = null;
  private reactionI: BaseReaction | null = null;

  public constructor(public channel: LiveChatChannel, private chatRoom: ChatRoom, private sdk: ArenaChat) {
    if (this.sdk.site === null) {
      throw new Error('Cannot create a channel without a site.');
    }

    this.graphQLAPI = new GraphQLAPI(this.sdk.site, this.sdk.user || undefined);

    this.realtimeAPI = RealtimeAPI.getInstance();

    this.watchChatConfigChanges();

    this.sdk.onUserChanged((user: ExternalUser | null) => this.watchUserChanged(user));

    this.markReadDebounced = debounce(this.markRead, 10000);
  }

  public static getInstance(channel: LiveChatChannel, chatRoom: ChatRoom, sdk: ArenaChat): Channel {
    if (!Channel.instances[channel._id]) {
      Channel.instances[channel._id] = new Channel(channel, chatRoom, sdk);
    }

    return Channel.instances[channel._id];
  }

  /**
   * Mark all messages on this channel as read.
   */
  private async markRead(): Promise<boolean> {
    try {
      const result = await this.graphQLAPI.markOpenChannelRead(this.channel._id);

      return result;
    } catch (e) {
      throw new Error('Cannot set group channel read.');
    }
  }

  /**
   * Get the user profile by a user id
   *
   * @param messageId Message id
   */
  public async fetchReactions(messageId: string): Promise<ChannelMessageReactions> {
    if (this.reactionI === null) {
      const { Reaction } = await import('../reaction/reaction');

      this.reactionI = new Reaction(this.channel._id, this.sdk);

      return this.reactionI.fetchReactions(messageId);
    }

    return this.reactionI.fetchReactions(messageId);
  }

  public async getChatQnaInstance(): Promise<BaseQna> {
    if (typeof this.channel.qnaId === 'undefined') {
      throw new Error(`Cannot get the Q&A for this channel: "${this.channel._id}"`);
    }

    const { Qna } = await import('../qna/qna');

    const qnaProps = await Qna.getQnaProps(this.channel.qnaId);

    const qnaI = new Qna(qnaProps, this.channel.qnaId, this.sdk);

    return qnaI;
  }

  public async getPollsIntance(userId: string): Promise<BasePolls> {
    const { Polls } = await import('../polls/polls');

    this.polls = new Polls(this.channel, this.sdk);

    if (this.sdk.user) {
      userId = this.sdk.user.id;
    }

    if (userId) {
      this.polls.watchUserPollsReactions(userId);
    }

    return this.polls;
  }

  /**
   * Ban a user
   * @param user
   * @returns {Promise<void>} only waits for the service return
   */
  public async banUser(user: ChatMessageSender): Promise<void> {
    if (this.sdk.site === null) {
      throw new Error('Cannot ban a user without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot ban a user without a user');
    }

    if (typeof user === 'undefined' || user === null) {
      throw new Error('You have to inform a user');
    }

    const requestUser: BanUser = {
      anonymousId: user.anonymousId,
      image: user.photoURL,
      name: user.displayName,
      siteId: this.sdk.site._id,
      userId: user.uid,
    };

    try {
      const restAPI = RestAPI.getAPIInstance()
      await restAPI.banUser(requestUser);
    } catch (e) {
      throw new Error(
        `Cannot ban this user: "${requestUser.userId || requestUser.anonymousId}". Contact the Arena support team.`,
      );
    }
  }

  public async deleteMessage(message: ChatMessage): Promise<boolean> {
    if (this.sdk.site === null) {
      throw new Error('Cannot request moderation without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot ban a user without a user');
    }

    if (typeof message === 'undefined' || !message.key) {
      throw new Error('You have to inform a message');
    }

    try {
      return this.graphQLAPI.deleteOpenChannelMessage(this.channel._id, message.key);
    } catch (e) {
      throw new Error(`Cannot delete this message: "${message.key}". Contact the Arena support team.`);
    }
  }

  public async reportMessage(message: ChatMessage, anonymousId?: string): Promise<boolean> {
    if (this.sdk.site === null) {
      throw new Error('Cannot request moderation without a site id');
    }

    if (typeof message === 'undefined' || !message.key) {
      throw new Error('You have to inform a message');
    }

    if (!this.sdk.user && !anonymousId) {
      throw new Error('Cannot report a message without a user');
    }

    const reportedBy: ChatMessageReportedBy = {
      uid: this.sdk.user?.id || anonymousId,
      displayName: this.sdk.user?.name || 'Anonymous User',
      image: this.sdk.user?.image,
      reportedByType: this.sdk.user?.id && this.sdk.user?.token ? 'user' : 'anonymous',
    };

    try {
      return this.graphQLAPI.reportOpenChannelMessage(this.channel._id, message.key, reportedBy);
    } catch (e) {
      throw new Error(`Cannot report this message: "${message.key}". Contact the Arena support team.`);
    }
  }

  /**
   * Request chat moderation for current user
   *
   * @returns {Promise<Moderation>} moderation
   */
  public async requestModeration(): Promise<Moderation> {
    if (this.sdk.site === null) {
      throw new Error('Cannot request moderation without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot request moderation without a user');
    }

    if (this.sdk.mainChatRoom === null) {
      throw new Error('Cannot request moderation without a chat room');
    }

    try {
      const restAPI = RestAPI.getAPIInstance()
      return await restAPI.requestModeration(this.sdk.site, this.sdk.mainChatRoom);
    } catch (e) {
      throw new Error(`Cannot request moderation for user: "${this.sdk.user.id}". Contact the Arena support team.`);
    }
  }

  /**
   * Send message on the channel
   *
   * @param text
   */
  public async sendMessage({
    text,
    replyTo,
    mediaURL,
    isGif,
    tempId,
    sender,
    slowMode,
  }: {
    text?: string;
    replyTo?: string;
    mediaURL?: string;
    isGif?: boolean;
    tempId?: string;
    sender?: ChatMessageSender;
    slowMode?: boolean;
  }): Promise<string> {
    if (text?.trim() === '' && (!mediaURL || mediaURL?.trim() === '')) {
      throw new Error('Cannot send an empty message.');
    }

    if (this.sdk.site === null) {
      throw new Error('Cannot send message without a site id');
    }

    if (this.sdk.user === null && !sender) {
      throw new Error('Cannot send message without a user');
    }

    const chatMessage: ChatMessage = {
      message: {
        text: text || '',
      },
      openChannelId: this.channel._id,
      sender,
      tempId,
      replyTo,
    };

    if (mediaURL) {
      chatMessage.message.media = {
        url: mediaURL,
      };

      if (isGif) {
        chatMessage.message.media.isGif = isGif;
      }
    }

    if (typeof slowMode !== 'undefined') {
      chatMessage.slowMode = slowMode;
    }

    try {
      const response = await this.graphQLAPI.sendMessaToChannel(chatMessage);

      return response;
    } catch (e) {
      throw new Error(`Cannot send this message: "${text}". Contact the Arena support team.`);
    }
  }

  /**
   * Send message on the channel
   *
   * @param text
   * @param amount
   */
  public async sendMonetizationMessage({
    text,
    amount,
    sender
  }: {
    text?: string;
    amount?: number;
    sender?: ChatMessageSender;
  }): Promise<string> {
    if (this.sdk.site === null) {
      throw new Error('Cannot send message without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot send message without a user');
    }

    const chatMessage: any = {
      messageInput: {
        message: {
          text
        },
        openChannelId: this.channel._id,
        sender
      },
      amount,
    };

    try {
      const response = await this.graphQLAPI.sendMonetizationMessageToChannel(chatMessage);

      return response;
    } catch (e) {
      throw new Error(`Cannot send this message: "${text}". Contact the Arena support team.`);
    }
  }

  /**
   * Watch user changed
   *
   * @param {ExternalUser} user external user
   */
  private watchUserChanged(user: ExternalUser | null) {
    if (user !== null) {
      this.watchUserReactions(user);
    } else {
      if (this.userReactionsSubscription !== null) {
        this.userReactionsSubscription();
      }
    }

    if (this.polls) {
      this.polls.offAllListeners();

      if (user?.id) {
        this.polls.watchUserPollsReactions(user.id);
      }

      this.polls.onUserChanged(user);
    }

    if (this.sdk.site) {
      this.graphQLAPI = new GraphQLAPI(this.sdk.site, user || undefined);
    }
  }

  /**
   * Watch user reactions
   *
   * @param user external user
   */
  private watchUserReactions(user: ExternalUser) {
    if (this.userReactionsSubscription !== null) {
      this.userReactionsSubscription();
    }

    try {
      this.userReactionsSubscription = this.realtimeAPI.listenToUserReactions(this.channel._id, user, (reactions) => {
        this.cacheUserReactions = {};

        reactions.forEach((reaction) => {
          if (!this.cacheUserReactions[reaction.itemId]) {
            this.cacheUserReactions[reaction.itemId] = [];
          }

          this.cacheUserReactions[reaction.itemId].push(reaction);
        });

        this.notifyUserReactionsVerification();
      });
    } catch (e) {
      throw new Error('Cannot listen to user reactions');
    }
  }

  /**
   * Notify User Reaction Verication
   */
  private notifyUserReactionsVerification() {
    this.cacheCurrentMessages.forEach((message) => {
      if (typeof message.key === 'undefined') {
        return;
      }

      const reactions = this.cacheUserReactions[message.key];

      if (reactions && this.shouldCurrentUserReactionToNotify(message, reactions)) {
        reactions.forEach((reaction) => {
          if (typeof message.currentUserReactions === 'undefined') {
            message.currentUserReactions = {};
          }

          message.currentUserReactions[reaction.reaction] = true;
        });

        const modifiedCallbacks = this.messageModificationCallbacks[MessageChangeType.MODIFIED];
        if (typeof modifiedCallbacks !== 'undefined') {
          modifiedCallbacks.forEach((callback) => callback({ ...message }));
        }
      }
    });
  }

  private shouldCurrentUserReactionToNotify(message: ChatMessage, serverReactions: ServerReaction[]) {
    const currentUserReactions = message.currentUserReactions;

    if (typeof currentUserReactions === 'undefined') {
      return true;
    }

    for (let i = 0; i < serverReactions.length; i++) {
      const reactionName = serverReactions[i].reaction;
      if (!currentUserReactions[reactionName]) {
        return true;
      }
    }

    return false;
  }

  /**
   * Update the cache of current messages
   *
   * @param {ChatMessage[]} messages updated messages
   */
  private updateCacheCurrentMessages(messages: ChatMessage[]): void {
    this.cacheCurrentMessages = messages;

    this.notifyUserReactionsVerification();
  }

  /**
   * Load recent messages on channel
   *
   * @param limit number of last messages
   */
  public async loadRecentMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      const messages = await this.realtimeAPI.fetchRecentMessages(this.channel.dataPath, limit);

      this.updateCacheCurrentMessages(messages);

      this.markReadDebounced();

      return messages;
    } catch (e) {
      throw new Error(`Cannot load messages on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Load previous messages on channel
   *
   * @param limit number of previous messages
   */
  public async loadPreviousMessages(limit?: number): Promise<ChatMessage[]> {
    if (!this.cacheCurrentMessages.length) {
      return [];
    }

    try {
      const firstMessage = this.cacheCurrentMessages[0];

      const messages = await this.realtimeAPI.fetchPreviousMessages(this.channel.dataPath, firstMessage, limit);

      this.updateCacheCurrentMessages([...messages, ...this.cacheCurrentMessages]);

      return messages;
    } catch (e) {
      throw new Error(`Cannot load previous messages on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Send a like reaction
   *
   */
  public async sendReaction(
    reaction: MessageReaction,
    anonymousId?: string,
    isDashboardUser = false,
  ): Promise<MessageReaction> {
    if (this.sdk.site === null) {
      throw new Error('Cannot react to a message without a site id');
    }

    const userId = this.sdk.user?.id || anonymousId;

    if (typeof userId === 'undefined') {
      throw new Error('Cannot react to a message without a user');
    }

    try {
      const serverReaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: reaction.type,
        publisherId: this.sdk.site._id,
        itemId: reaction.messageID,
        userId,
        openChannelId: this.channel._id,
        chatRoomId: this.chatRoom._id,
        chatRoomVersion: this.chatRoom.version,
        isDashboardUser,
      };

      const restAPI = RestAPI.getAPIInstance()
      const result = await restAPI.sendReaction(serverReaction);

      return {
        id: result,
        type: serverReaction.reaction,
        messageID: serverReaction.itemId,
      };
    } catch (e) {
      throw new Error(`Cannot react to the message "${reaction.messageID}"`);
    }
  }

  /**
   * Remove a reaction
   *
   */

  public async deleteReaction(reaction: MessageReaction, anonymousId?: string): Promise<boolean> {
    if (this.sdk.site === null) {
      throw new Error('Cannot react to a message without a site id');
    }

    const userId = this.sdk.user?.id || anonymousId;

    if (typeof userId === 'undefined') {
      throw new Error('Cannot react to a message without a user');
    }

    try {
      const result = await this.graphQLAPI.deleteReaction(userId, reaction.messageID, reaction.type);

      return result;
    } catch (e) {
      throw new Error(`Cannot delete reaction from message "${reaction.messageID}"`);
    }
  }

  /**
   * Fetch Pin Messages for current channel
   *
   */
  public async fetchPinMessage(): Promise<ChatMessage> {
    if (this.sdk.site === null) {
      throw new Error('Cannot fetch pinned message without a site id');
    }

    try {
      const pinMessage = await this.graphQLAPI.fetchPinMessage({ channelId: this.channel._id });

      return pinMessage;
    } catch (e) {
      throw new Error(`Cannot fetch pin messages on "${this.chatRoom.slug}" channel.`);
    }
  }

  /**
   * Remove message modified listener
   *
   */
  public offMessageReceived(): void {
    this.messageModificationCallbacks[MessageChangeType.ADDED] = [];
  }

  /**
   * Watch new messages on channel
   *
   * @param callback
   */
  public onMessageReceived(callback: (message: ChatMessage) => void): void {
    try {
      this.registerMessageModificationCallback((newMessage) => {
        if (this.cacheCurrentMessages.some((message) => newMessage.key === message.key)) {
          return;
        }

        const messages = [...this.cacheCurrentMessages, newMessage];

        this.updateCacheCurrentMessages(messages);

        if (this.sdk.user?.id !== newMessage.sender?._id) {
          this.markReadDebounced();
        }

        callback(newMessage);
      }, MessageChangeType.ADDED);
    } catch (e) {
      throw new Error(`Cannot watch new messages on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Remove message modified listener
   *
   */
  public offMessageModified(): void {
    this.messageModificationCallbacks[MessageChangeType.MODIFIED] = [];
  }

  /**
   * Watch messages modified
   *
   * @param callback
   */
  public onMessageModified(callback: (message: ChatMessage) => void): void {
    try {
      this.registerMessageModificationCallback((modifiedMessage) => {
        const messages = this.cacheCurrentMessages.map((message) => {
          if (
            message.key === modifiedMessage.key &&
            Reaction.hasBeenModified(message.reactions, modifiedMessage.reactions)
          ) {
            modifiedMessage.currentUserReactions = message.currentUserReactions;
            return modifiedMessage;
          }

          return message;
        });

        this.updateCacheCurrentMessages(messages);

        callback(modifiedMessage);
      }, MessageChangeType.MODIFIED);
    } catch (e) {
      throw new Error(`Cannot watch messages modified on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Remove message deleted listener
   *
   */
  public offMessageDeleted(): void {
    this.messageModificationCallbacks[MessageChangeType.REMOVED] = [];
  }

  /**
   * Watch messages deleted
   *
   * @param callback
   */
  public onMessageDeleted(callback: (message: ChatMessage) => void): void {
    try {
      this.registerMessageModificationCallback((message) => {
        const messages = this.cacheCurrentMessages.filter((item) => item.key !== message.key);

        this.updateCacheCurrentMessages(messages);

        callback(message);
      }, MessageChangeType.REMOVED);
    } catch (e) {
      throw new Error(`Cannot watch deleted messages on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Remove all channel's listeners
   *
   */
  public offAllListeners(): void {
    this.messageModificationCallbacks[MessageChangeType.ADDED] = [];
    this.messageModificationCallbacks[MessageChangeType.MODIFIED] = [];
    this.messageModificationCallbacks[MessageChangeType.REMOVED] = [];
  }

  /**
   * Register message modification callback
   *
   */
  private registerMessageModificationCallback(callback: (message: ChatMessage) => void, type: MessageChangeType) {
    if (!this.messageModificationCallbacks[type]) {
      this.messageModificationCallbacks[type] = [];
    }

    this.messageModificationCallbacks[type].push(callback);

    this.listenToAllTypeMessageModification();
  }

  /**
   * Listen to all type message modification
   *
   */
  private listenToAllTypeMessageModification() {
    if (this.messageModificationListener !== null) {
      return;
    }

    this.messageModificationListener = this.realtimeAPI.listenToMessageReceived(this.channel.dataPath, (message) => {
      if (message.changeType === undefined || !this.messageModificationCallbacks[message.changeType]) {
        return;
      }

      this.messageModificationCallbacks[message.changeType].forEach((callback) => callback(message));
    });
  }

  /**
   * Watch chat config changes
   *
   */
  public watchChatConfigChanges(callback?: (channel: LiveChatChannel) => void): () => void {
    try {
      const path = `/chat-rooms/${this.chatRoom._id}/channels/${this.channel._id}`;
      return this.realtimeAPI.listenToChatConfigChanges(path, (nextChatRoom) => {
        this.channel = {
          ...nextChatRoom,
          _id: this.channel._id,
          dataPath: this.channel.dataPath,
        };

        if (callback) {
          callback(this.channel);
        }
      });
    } catch (e) {
      throw new Error('Cannot listen to chat config changes');
    }
  }
}
