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
  ChannelReaction,
} from '@arena-im/chat-types';
import {
  User,
  UserObservable,
  OrganizationSite,
  ReactionsAPIWS,
  BaseReactionsAPI,
  ReactionsAPIFirestore,
} from '@arena-im/core';
import { RealtimeAPI } from '../services/realtime-api';
import { GraphQLAPI } from '../services/graphql-api';
import { debounce } from '../utils/misc';
import { Reaction } from '../reaction/reaction';
import { RestAPI } from '../services/rest-api';
import { isEqualReactions } from '../utils/is';

export class Channel implements BaseChannel {
  private static instances: { [key: string]: Channel } = {};
  private cacheCurrentMessages: ChatMessage[] = [];
  private cacheUserReactions: { [key: string]: ServerReaction[] } = {};
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListenerUnsubscribe: (() => void) | null = null;
  private userReactionsSubscription: (() => void) | null = null;
  private channelReactionsSubscription: (() => void) | null = null;
  public markReadDebounced: () => void;
  public polls: BasePolls | null = null;
  private reactionI: BaseReaction | null = null;
  private reactionsAPI: BaseReactionsAPI;

  private constructor(public channel: LiveChatChannel, private readonly chatRoom: ChatRoom) {
    this.watchChatConfigChanges();
    UserObservable.instance.onUserChanged((user: ExternalUser | null) => this.watchUserChanged(user));
    this.markReadDebounced = debounce(this.markRead, 10000);
    this.reactionsAPI = this.getReactionsAPIInstance();
  }

  public static getInstance(channel: LiveChatChannel, chatRoom: ChatRoom): Channel {
    if (!Channel.instances[channel._id]) {
      Channel.instances[channel._id] = new Channel(channel, chatRoom);
    }

    return Channel.instances[channel._id];
  }

  private async initReactions() {
    // const channelReactions = await this.reactionsAPI.fetchChannelReactions();
    // await this.updateCacheMessageReactions(channelReactions, true);

    this.watchUserReactions();
    this.watchChannelReactions();
  }

  private getReactionsAPIInstance(): BaseReactionsAPI {
    if (this.chatRoom.useNewReactionAPI) {
      return ReactionsAPIWS.getInstance(this.chatRoom._id);
    } else {
      return ReactionsAPIFirestore.getInstance(this.channel._id);
    }
  }

  /**
   * Mark all messages on this channel as read.
   */
  private async markRead(): Promise<boolean> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.markOpenChannelRead(this.channel._id);

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

      this.reactionI = new Reaction(this.chatRoom._id);

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

    const qnaI = new Qna(qnaProps, this.channel.qnaId);

    return qnaI;
  }

  public async getPollsInstance(userId: string): Promise<BasePolls> {
    const { Polls } = await import('../polls/polls');

    this.polls = new Polls(this.channel, this.chatRoom);

    if (User.instance.data) {
      userId = User.instance.data.id;
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
    if (User.instance.data === null) {
      throw new Error('Cannot ban a user without a user');
    }

    if (typeof user === 'undefined' || user === null) {
      throw new Error('You have to inform a user');
    }

    const site = await OrganizationSite.instance.getSite();

    const requestUser: BanUser = {
      anonymousId: user.anonymousId,
      image: user.photoURL,
      name: user.displayName,
      siteId: site._id,
      userId: user.uid,
    };

    try {
      const restAPI = RestAPI.getAPIInstance();
      await restAPI.banUser(requestUser);
    } catch (e) {
      throw new Error(
        `Cannot ban this user: "${requestUser.userId || requestUser.anonymousId}". Contact the Arena support team.`,
      );
    }
  }

  public async deleteMessage(message: ChatMessage): Promise<boolean> {
    if (User.instance.data === null) {
      throw new Error('Cannot ban a user without a user');
    }

    if (typeof message === 'undefined' || !message.key) {
      throw new Error('You have to inform a message');
    }

    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const response = await graphQLAPI.deleteOpenChannelMessage(this.channel._id, message.key);

      return response;
    } catch (e) {
      throw new Error(`Cannot delete this message: "${message.key}". Contact the Arena support team.`);
    }
  }

  public async reportMessage(message: ChatMessage, anonymousId?: string): Promise<boolean> {
    if (typeof message === 'undefined' || !message.key) {
      throw new Error('You have to inform a message');
    }

    if (!User.instance.data && !anonymousId) {
      throw new Error('Cannot report a message without a user');
    }

    const reportedBy: ChatMessageReportedBy = {
      uid: User.instance.data?.id || anonymousId,
      displayName: User.instance.data?.name || 'Anonymous User',
      image: User.instance.data?.image,
      reportedByType: User.instance.data?.id && User.instance.data?.token ? 'user' : 'anonymous',
    };

    const graphQLAPI = await GraphQLAPI.instance;
    try {
      return graphQLAPI.reportOpenChannelMessage(this.channel._id, message.key, reportedBy);
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
    if (User.instance.data === null) {
      throw new Error('Cannot request moderation without a user');
    }

    const site = await OrganizationSite.instance.getSite();

    try {
      const restAPI = RestAPI.getAPIInstance();
      return await restAPI.requestModeration(site, this.chatRoom);
    } catch (e) {
      throw new Error(
        `Cannot request moderation for user: "${User.instance.data.id}". Contact the Arena support team.`,
      );
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

    if (User.instance.data === null && !sender) {
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

    const graphQLAPI = await GraphQLAPI.instance;
    try {
      const response = await graphQLAPI.sendMessaToChannel(chatMessage);

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
    sender,
  }: {
    text?: string;
    amount?: number;
    sender?: ChatMessageSender;
  }): Promise<string> {
    if (User.instance.data === null) {
      throw new Error('Cannot send message without a user');
    }

    const chatMessage: any = {
      messageInput: {
        message: {
          text,
        },
        openChannelId: this.channel._id,
        sender,
      },
      amount,
    };

    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const response = await graphQLAPI.sendMonetizationMessageToChannel(chatMessage);

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
    if (this.polls) {
      this.polls.offAllListeners();

      if (user?.id) {
        this.polls.watchUserPollsReactions(user.id);
      }
    }
  }

  /**
   * Update cached user reactions and notify message update
   *
   * @param reactions received user reactions from websocket or firestore
   */
  private updateCacheUserReactions(reactions: ServerReaction[]) {
    this.cacheUserReactions = {};

    reactions.forEach((reaction) => {
      if (!this.cacheUserReactions[reaction.itemId]) {
        this.cacheUserReactions[reaction.itemId] = [];
      }

      this.cacheUserReactions[reaction.itemId].push(reaction);
    });

    // this.notifyUserReactionsVerification();
  }

  /**
   * Update cached message reactions and notify message update
   *
   * @param reactions received user reactions from websocket
   */
  private async updateCacheMessageReactions(reactions: ChannelReaction[], silent = false) {
    this.cacheUserReactions = {};

    const userReactions = await this.reactionsAPI.fetchUserReactions();
    this.updateCacheUserReactions(userReactions);

    reactions.forEach((reaction) => {
      const message = this.getMessageFromCacheByKey(reaction.itemId);

      if (message === null) return;

      let shouldNotifyMessageModified = false;

      if (!message.reactions || !isEqualReactions(message.reactions, reaction.reactions)) {
        message.reactions = reaction.reactions;

        shouldNotifyMessageModified = true;
      }

      if (this.addUserReactions(message)) {
        shouldNotifyMessageModified = true;
      }

      const modifiedCallbacks = this.messageModificationCallbacks[MessageChangeType.MODIFIED];
      if (shouldNotifyMessageModified && !silent && typeof modifiedCallbacks !== 'undefined') {
        modifiedCallbacks.forEach((callback) => callback({ ...message }));
      }
    });

    // this.notifyUserReactionsVerification();
  }

  /**
   * Get message from cache
   *
   * @param key message key
   * @returns
   */
  private getMessageFromCacheByKey(key: string): ChatMessage | null {
    for (let i = 0; i < this.cacheCurrentMessages.length; i++) {
      const message = this.cacheCurrentMessages[i];
      if (message.key === key) {
        return message;
      }
    }

    return null;
  }

  // TODO: reset user reactions
  private async resetUserReactions(userReactions: ServerReaction[]) {
    const messagesToNotify: { [messageKey: string]: ChatMessage } = {};

    // remove all user reactions from messages
    for (const message of this.cacheCurrentMessages) {
      if (message.currentUserReactions) {
        delete message.currentUserReactions;
        messagesToNotify[message.key!] = message;
      }
    }

    this.updateCacheUserReactions(userReactions);

    // send notifycation
    const modifiedCallbacks = this.messageModificationCallbacks[MessageChangeType.MODIFIED];

    for (const userReaction of userReactions) {
      const message = this.getMessageFromCacheByKey(userReaction.itemId);

      if (message === null) continue;

      if (typeof message.currentUserReactions === 'undefined') {
        message.currentUserReactions = {};
      }

      message.currentUserReactions[userReaction.reaction] = true;

      messagesToNotify[message.key!] = message;
    }

    if (typeof modifiedCallbacks !== 'undefined') {
      for (const message of Object.values(messagesToNotify)) {
        modifiedCallbacks.forEach((callback) => callback({ ...message }));
      }
    }
  }

  /**
   * Watch user reactions
   *
   * @param user external user
   */
  private watchUserReactions(): void {
    if (this.userReactionsSubscription !== null) {
      this.userReactionsSubscription();
    }

    this.userReactionsSubscription = this.reactionsAPI.watchUserReactions(this.resetUserReactions.bind(this));
  }

  /**
   * Watch Channel reactions
   *
   */
  private watchChannelReactions(): void {
    if (this.channelReactionsSubscription !== null) {
      this.channelReactionsSubscription();
    }

    this.channelReactionsSubscription = this.reactionsAPI.watchChannelReactions(
      this.updateCacheMessageReactions.bind(this),
    );
  }

  /**
   * Notify User Reaction Verication
   */
  private addUserReactions(message: ChatMessage) {
    let shouldNotifyMessageModified = false;
    const reactions = this.cacheUserReactions[message.key!];

    if (reactions && this.shouldCurrentUserReactionToNotify(message, reactions)) {
      for (const reaction of reactions) {
        if (typeof message.currentUserReactions === 'undefined') {
          message.currentUserReactions = {};
        }

        message.currentUserReactions[reaction.reaction] = true;
      }
      shouldNotifyMessageModified = true;
    }

    return shouldNotifyMessageModified;
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

    this.reactionsAPI.fetchChannelReactions().then((channelReactions) => {
      this.updateCacheMessageReactions(channelReactions, true);
    });
  }

  /**
   * Load recent messages on channel
   *
   * @param limit number of last messages
   */
  public async loadRecentMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      const realtimeAPI = RealtimeAPI.getInstance();
      const messages = await realtimeAPI.fetchRecentMessages(this.channel.dataPath, limit);

      this.updateCacheCurrentMessages(messages);

      this.markReadDebounced();

      await this.initReactions();

      return this.cacheCurrentMessages;
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

      const realtimeAPI = RealtimeAPI.getInstance();
      const messages = await realtimeAPI.fetchPreviousMessages(this.channel.dataPath, firstMessage, limit);

      this.updateCacheCurrentMessages(messages.concat(this.cacheCurrentMessages));

      return messages;
    } catch (e) {
      throw new Error(`Cannot load previous messages on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Send a like reaction
   *
   */
  public async sendReaction(reaction: MessageReaction, anonymousId?: string, isDashboardUser = false): Promise<void> {
    const userId = User.instance.data?.id || anonymousId;

    if (typeof userId === 'undefined') {
      throw new Error('Cannot react to a message without a user');
    }

    const site = await OrganizationSite.instance.getSite();

    try {
      const serverReaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: reaction.type,
        publisherId: site._id,
        itemId: reaction.messageID,
        userId,
        openChannelId: this.channel._id,
        chatRoomId: this.chatRoom._id,
        chatRoomVersion: this.chatRoom.version,
        isDashboardUser,
        widgetId: this.chatRoom._id,
        widgetType: 'Chat Room',
      };

      await this.createReaction(serverReaction);
    } catch (e) {
      throw new Error(`Cannot react to the message "${reaction.messageID}"`);
    }
  }

  /**
   * Create a reaction
   *
   */

  private createReaction(serverReaction: ServerReaction) {
    this.reactionsAPI.createReaction(serverReaction);
  }

  /**
   * Remove a reaction
   *
   */

  public async deleteReaction(reaction: MessageReaction, anonymousId?: string): Promise<boolean> {
    const site = await OrganizationSite.instance.getSite();

    if (site === null) {
      throw new Error('Cannot react to a message without a site id');
    }

    const userId = User.instance.data?.id || anonymousId;

    if (typeof userId === 'undefined') {
      throw new Error('Cannot react to a message without a user');
    }

    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const result = await graphQLAPI.deleteReaction(userId, reaction.messageID, reaction.type);

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
    const site = await OrganizationSite.instance.getSite();

    if (site === null) {
      throw new Error('Cannot fetch pinned message without a site id');
    }

    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const pinMessage = await graphQLAPI.fetchPinMessage({ channelId: this.channel._id });

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

    this.unsubscribeMessageModification();
  }

  /**
   * Watch new messages on channel
   *
   * @param callback
   */
  public onMessageReceived(callback: (message: ChatMessage) => void): void {
    try {
      this.initReactions();
      this.registerMessageModificationCallback((newMessage) => {
        if (this.cacheCurrentMessages.some((message) => newMessage.key === message.key)) {
          return;
        }

        const messages = this.cacheCurrentMessages.concat(newMessage);

        this.updateCacheCurrentMessages(messages);

        if (User.instance.data?.id !== newMessage.sender?._id) {
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

    this.unsubscribeMessageModification();
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

    this.unsubscribeMessageModification();
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

    // this.reactionsAPI.offAllListeners();

    this.unsubscribeMessageModification();
  }

  private unsubscribeMessageModification(): void {
    // check if has some registered listeners
    for (const listener of Object.values(this.messageModificationCallbacks)) {
      if (listener.length) {
        return;
      }
    }

    if (typeof this.messageModificationListenerUnsubscribe === 'function') {
      console.log('unsubscribe', this.messageModificationListenerUnsubscribe);
      this.messageModificationListenerUnsubscribe();
      this.messageModificationListenerUnsubscribe = null;
    }
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
    if (this.messageModificationListenerUnsubscribe !== null) {
      return;
    }

    const realtimeAPI = RealtimeAPI.getInstance();

    this.messageModificationListenerUnsubscribe = realtimeAPI.listenToMessageReceived(
      this.channel.dataPath,
      (message) => {
        if (message.changeType === undefined || !this.messageModificationCallbacks[message.changeType]) {
          return;
        }

        this.messageModificationCallbacks[message.changeType].forEach((callback) => callback(message));
      },
    );
  }

  /**
   * Watch chat config changes
   *
   */
  public watchChatConfigChanges(callback?: (channel: LiveChatChannel) => void): () => void {
    try {
      const realtimeAPI = RealtimeAPI.getInstance();
      const path = `/chat-rooms/${this.chatRoom._id}/channels/${this.channel._id}`;
      return realtimeAPI.listenToChatConfigChanges(path, (nextChatRoom) => {
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
