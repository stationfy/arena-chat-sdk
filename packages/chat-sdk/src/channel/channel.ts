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
  ChannelReaction,
  ChatMessageToSend,
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
import { ChatConfigType } from '@arena-im/chat-types/dist/chat-message';

export class Channel implements BaseChannel {
  private static instances: { [key: string]: Channel } = {};
  private cacheCurrentMessages: ChatMessage[] = [];
  private cacheUserReactions: { [key: string]: ServerReaction[] } = {};
  private cacheChannelReactions: { [key: string]: ChannelReaction } = {};
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListenerUnsubscribe: (() => void) | null = null;
  private userReactionsSubscription: (() => void) | null = null;
  private channelReactionsSubscription: (() => void) | null = null;
  private reactionsErrorsSubscription: (() => void) | null = null;
  private chatConfigListenerUnsubscribe: (() => void) | null = null;
  public markReadDebounced: () => void;
  public polls: BasePolls | null = null;
  private reactionsAPI: BaseReactionsAPI;
  private fetchPreviousMessagesPromise = false;
  private totalLimit: number | null = null;
  private chatConfigChangesCallbacks: { [type: string]: ((item: LiveChatChannel | ChatMessage) => void)[] } = {};
  private pinnedMessageId: string | null = null;

  private constructor(public channel: LiveChatChannel, private readonly chatRoom: ChatRoom) {
    this.watchChatConfigChanges(
      this.updateChannelChatConfig.bind(this) as (item: ChatMessage | LiveChatChannel) => void,
      ChatConfigType.ALL_CHAT_CHANGES,
    );
    UserObservable.instance.onUserChanged((user: ExternalUser | null) => this.watchUserChanged(user));
    this.markReadDebounced = debounce(this.markRead, 120000);
    this.reactionsAPI = this.getReactionsAPIInstance();
  }

  public static getInstance(channel: LiveChatChannel, chatRoom: ChatRoom): Channel {
    if (!Channel.instances[channel._id]) {
      Channel.instances[channel._id] = new Channel(channel, chatRoom);
    }

    return Channel.instances[channel._id];
  }

  private async initReactionsListeners() {
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

    this.polls.onPollModified((poll) => {
      for (const message of this.cacheCurrentMessages) {
        if (message.poll?._id === poll._id) {
          message.poll = poll;
          this.emitMessagesChange([message]);
          break;
        }
      }
    });

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

    if (!sender) {
      sender = {
        _id: User.instance.data?.id,
        name: User.instance.data?.name,
        image: User.instance.data?.image,
      };
    } else {
      sender = {
        _id: sender._id,
        name: sender.name,
        image: sender.image,
      };
    }

    const chatMessage: ChatMessageToSend = {
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

  private emitMessagesChange(messages: ChatMessage[]) {
    const modifiedCallbacks = this.messageModificationCallbacks[MessageChangeType.MODIFIED];

    if (typeof modifiedCallbacks !== 'undefined') {
      for (const message of messages) {
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
    if (typeof this.userReactionsSubscription === 'function') {
      this.userReactionsSubscription();
    }

    this.userReactionsSubscription = this.reactionsAPI.watchUserReactions((userReactions: ServerReaction[]) => {
      const userReactionsMap = this.getUserReactionsMap(userReactions);

      this.cacheUserReactions = userReactionsMap;

      const messages = this.mergeMessagesAndReactions(this.cacheCurrentMessages, {
        userReactionsMap: this.cacheUserReactions,
        channelReactionsMap: this.cacheChannelReactions,
      });

      this.updateCacheCurrentMessages(messages);
    });
  }

  public watchReactionsErrors(callback: (error: any) => void): void {
    if (this.reactionsErrorsSubscription !== null) {
      this.reactionsErrorsSubscription();
    }

    this.reactionsErrorsSubscription = this.reactionsAPI.watchReactionsErrors(callback);
  }

  /**
   * Watch Channel reactions
   *
   */
  private watchChannelReactions(): void {
    if (typeof this.channelReactionsSubscription === 'function') {
      this.channelReactionsSubscription();
    }

    this.channelReactionsSubscription = this.reactionsAPI.watchChannelReactions(
      (channelReactions: ChannelReaction[]) => {
        const channelReactionsMap = this.getChannelReactionsMap(channelReactions);

        this.cacheChannelReactions = channelReactionsMap;

        const messages = this.mergeMessagesAndReactions(this.cacheCurrentMessages, {
          userReactionsMap: this.cacheUserReactions,
          channelReactionsMap: this.cacheChannelReactions,
        });

        this.updateCacheCurrentMessages(messages);
      },
    );
  }

  /**
   * Update the cache of current messages
   *
   * @param {ChatMessage[]} messages updated messages
   */
  private updateCacheCurrentMessages(messages: ChatMessage[]): void {
    this.cacheCurrentMessages = messages;
  }

  /**
   * Load recent messages on channel
   *
   * @param limit number of last messages
   */
  public async loadRecentMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      this.totalLimit = null;

      const [loadedMessages, reactions] = await Promise.all([this.fetchRecentMessages(limit), this.fetchReactions()]);

      const messages = this.mergeMessagesAndReactions(loadedMessages, reactions, true);

      this.updateCacheCurrentMessages(messages);

      if (this.chatRoom?.numChannels > 1) {
        this.markReadDebounced();
      }

      this.initReactionsListeners();

      return messages;
    } catch (e) {
      throw new Error(`Cannot load messages on "${this.channel._id}" channel.`);
    }
  }

  private async fetchRecentMessages(limit?: number): Promise<ChatMessage[]> {
    return new Promise((resolve) => {
      this.listenToAllTypeMessageModification((messages) => {
        resolve(messages);
      }, limit);
    });
  }

  private async fetchReactions() {
    try {
      const [channelReactionsMap, userReactionsMap] = await Promise.all([
        this.fetchChannelReactionsMap(),
        this.fetchUserReactionsMap(),
      ]);

      return { channelReactionsMap, userReactionsMap };
    } catch (e) {
      return { channelReactionsMap: {}, userReactionsMap: {} };
    }
  }

  private async fetchChannelReactionsMap() {
    try {
      const channelReactions = await this.reactionsAPI.fetchChannelReactions();

      this.cacheChannelReactions = this.getChannelReactionsMap(channelReactions);

      return this.cacheChannelReactions;
    } catch (e) {
      return {};
    }
  }

  private async fetchUserReactionsMap() {
    try {
      const userReactions = await this.reactionsAPI.fetchUserReactions();

      this.cacheUserReactions = this.getUserReactionsMap(userReactions);

      return this.cacheUserReactions;
    } catch (e) {
      return {};
    }
  }

  private getUserReactionsMap(userReactions: ServerReaction[]) {
    const map: { [messageId: string]: ServerReaction[] } = {};

    try {
      for (const userReaction of userReactions) {
        if (!map[userReaction.itemId]) {
          map[userReaction.itemId] = [];
        }
        map[userReaction.itemId].push(userReaction);
      }

      return map;
    } catch (e) {
      return {};
    }
  }

  private getChannelReactionsMap(channelReactions: ChannelReaction[]) {
    const map: { [messageId: string]: ChannelReaction } = {};

    for (const channelReaction of channelReactions) {
      map[channelReaction.itemId] = channelReaction;
    }

    return map;
  }

  private mergeMessagesAndReactions(
    messages: ChatMessage[],
    {
      userReactionsMap,
      channelReactionsMap,
    }: {
      userReactionsMap: {
        [messageKey: string]: ServerReaction[];
      };
      channelReactionsMap: {
        [messageKey: string]: ChannelReaction;
      };
    },
    silent?: boolean,
  ): ChatMessage[] {
    const updatedMessages: ChatMessage[] = [];

    for (const message of messages) {
      if (this.updateMessageWithReactions(message, userReactionsMap, channelReactionsMap)) {
        updatedMessages.push(message);
      }
    }

    if (!silent) {
      this.emitMessagesChange(updatedMessages);
    }

    return messages;
  }

  private updateMessageWithReactions(
    message: ChatMessage,
    userReactionsMap?: {
      [messageKey: string]: ServerReaction[];
    },
    channelReactionsMap?: {
      [messageKey: string]: ChannelReaction;
    },
  ) {
    let isMessageUpdated = false;

    if (userReactionsMap) {
      const userReactions = userReactionsMap[message.key];
      if (userReactions) {
        for (const userReaction of userReactions) {
          if (!message.currentUserReactions || !message.currentUserReactions[userReaction.reaction]) {
            if (!message.currentUserReactions) {
              message.currentUserReactions = {};
            }

            isMessageUpdated = true;
            message.currentUserReactions[userReaction.reaction] = true;
          }
        }
      }
    }

    if (channelReactionsMap) {
      const channelReaction = channelReactionsMap[message.key];

      if (channelReaction && (!message.reactions || !isEqualReactions(channelReaction.reactions, message.reactions))) {
        isMessageUpdated = true;
        message.reactions = channelReaction.reactions;
      }
    }

    return isMessageUpdated ? message : null;
  }

  /**
   * Load previous messages on channel
   *
   * @param limit number of previous messages
   */
  public async loadPreviousMessages(limit?: number): Promise<ChatMessage[]> {
    if (this.fetchPreviousMessagesPromise) {
      throw new Error('Another request is already in progress');
    }

    this.fetchPreviousMessagesPromise = true;

    if (!this.cacheCurrentMessages.length) {
      return [];
    }

    try {
      const firstMessage = this.cacheCurrentMessages[0];

      if (this.messageModificationListenerUnsubscribe !== null) {
        this.messageModificationListenerUnsubscribe();
        this.messageModificationListenerUnsubscribe = null;
      }

      return new Promise((resolve) => {
        this.listenToAllTypeMessageModification((messages) => {
          const previousMessages: ChatMessage[] = [];

          for (const message of messages) {
            if (message.key === firstMessage.key) {
              break;
            }

            previousMessages.push(message);
          }

          const nextMessages = this.mergeMessagesAndReactions(
            previousMessages,
            {
              userReactionsMap: this.cacheUserReactions,
              channelReactionsMap: this.cacheChannelReactions,
            },
            true,
          );

          this.updateCacheCurrentMessages(nextMessages.concat(this.cacheCurrentMessages));

          this.fetchPreviousMessagesPromise = false;

          resolve(nextMessages);
        }, limit);
      });
    } catch (e) {
      throw new Error(`Cannot load previous messages on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Send a like reaction
   *
   */
  public async sendReaction(reaction: MessageReaction, anonymousId?: string, isDashboardUser = false): Promise<void> {
    const userId = User.instance.data?.id || anonymousId || User.instance.anonymousId;

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

      this.updateUserReactionsCachedWithSendReaction(serverReaction);

      await this.createReaction(serverReaction);
    } catch (e) {
      throw new Error(`Cannot react to the message "${reaction.messageID}"`);
    }
  }

  private updateUserReactionsCachedWithSendReaction(userReaction: ServerReaction) {
    const message = this.getMessageFromCacheByKey(userReaction.itemId);

    if (!this.cacheUserReactions[userReaction.itemId]) {
      this.cacheUserReactions[userReaction.itemId] = [];
    }

    this.cacheUserReactions[userReaction.itemId].push(userReaction);

    if (
      message &&
      userReaction &&
      (!message.currentUserReactions || !message.currentUserReactions[userReaction.reaction])
    ) {
      if (!message.currentUserReactions) {
        message.currentUserReactions = {};
      }

      if (!message.reactions) {
        message.reactions = {};
      }

      message.reactions[userReaction.reaction] = (message.reactions[userReaction.reaction] ?? 0) + 1;

      message.currentUserReactions[userReaction.reaction] = true;

      this.emitMessagesChange([message]);
    }
  }

  private getMessageFromCacheByKey(messageKey: string) {
    const messages = this.cacheCurrentMessages;

    for (const message of messages) {
      if (message.key === messageKey) {
        return message;
      }
    }

    return null;
  }

  /**
   * Create a reaction
   *
   */

  private async createReaction(serverReaction: ServerReaction) {
    await this.reactionsAPI.createReaction(serverReaction);
  }

  /**
   * Remove a reaction
   *
   */

  public async deleteReaction(reaction: MessageReaction, isDashboardUser = false): Promise<ChannelReaction[]> {
    const site = await OrganizationSite.instance.getSite();

    if (site === null) {
      throw new Error('Cannot react to a message without a site id');
    }

    const userId = User.instance.data?.id || User.instance.anonymousId;

    if (typeof userId === 'undefined') {
      throw new Error('Cannot react to a message without a user');
    }

    try {
      const serverReaction = await this.convertMessageReactionToServerReaction(reaction, isDashboardUser);

      const result = await this.reactionsAPI.removeReaction(serverReaction);

      return result;
    } catch (e) {
      throw new Error(`Cannot delete reaction from message "${reaction.messageID}"`);
    }
  }

  private async convertMessageReactionToServerReaction(
    messageReaction: MessageReaction,
    isDashboardUser = false,
  ): Promise<ServerReaction> {
    const site = await OrganizationSite.instance.getSite();
    const userId = User.instance.data?.id || User.instance.anonymousId;

    return {
      itemType: 'chatMessage',
      reaction: messageReaction.type,
      publisherId: site._id,
      itemId: messageReaction.messageID,
      userId,
      openChannelId: this.channel._id,
      chatRoomId: this.chatRoom._id,
      chatRoomVersion: this.chatRoom.version,
      isDashboardUser,
      widgetId: this.chatRoom._id,
      widgetType: 'Chat Room',
    };
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
      this.initReactionsListeners();
      this.registerMessageModificationCallback((newMessage) => {
        if (this.cacheCurrentMessages.some((message) => newMessage.key === message.key)) {
          return;
        }

        const messages = this.cacheCurrentMessages.concat(newMessage);

        this.updateCacheCurrentMessages(messages);

        if (User.instance.data?.id !== newMessage.sender?._id && this.chatRoom?.numChannels > 1) {
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
  private listenToAllTypeMessageModification(callback?: (initialMessages: ChatMessage[]) => void, limit?: number) {
    if (this.messageModificationListenerUnsubscribe !== null) {
      return;
    }

    if (this.totalLimit === null && limit) {
      this.totalLimit = limit;
    } else if (this.totalLimit && limit) {
      this.totalLimit = this.totalLimit + limit;
    }

    const realtimeAPI = RealtimeAPI.getInstance();

    this.messageModificationListenerUnsubscribe = realtimeAPI.listenToMessageReceived(
      this.channel.dataPath,
      (message) => {
        if (message.changeType === undefined || !this.messageModificationCallbacks[message.changeType]) {
          return;
        }

        this.updateMessageWithReactions(message, this.cacheUserReactions, this.cacheChannelReactions);

        this.messageModificationCallbacks[message.changeType].forEach((messageModificationCallback) => {
          messageModificationCallback(message);
        });
      },
      callback,
      this.totalLimit ?? undefined,
    );
  }

  /**
   * Remove chat cofig changes listener
   *
   */
  private offChatConfigListener(callback: (item: LiveChatChannel | ChatMessage) => void, type: ChatConfigType): void {
    if (
      this.chatConfigChangesCallbacks[ChatConfigType.ALL_CHAT_CHANGES].length === 0 &&
      this.chatConfigChangesCallbacks[ChatConfigType.PIN_MESSAGES].length === 0 &&
      this.chatConfigListenerUnsubscribe
    ) {
      this.chatConfigListenerUnsubscribe();
      this.chatConfigListenerUnsubscribe = null;
    }

    const newCallbacksList = this.chatConfigChangesCallbacks[type].filter((item) => item !== callback);
    this.chatConfigChangesCallbacks[type] = newCallbacksList;
  }

  /**
   * Watch chat config changes
   *
   */
  public watchChatConfigChanges(
    callback: (item: LiveChatChannel | ChatMessage) => void,
    type?: ChatConfigType,
  ): () => void {
    const callbackType = type || ChatConfigType.ALL_CHAT_CHANGES;

    try {
      if (this.chatConfigChangesCallbacks[callbackType]) {
        this.chatConfigChangesCallbacks[callbackType].push(callback);
      } else {
        this.chatConfigChangesCallbacks[callbackType] = [callback];
      }

      if (!this.chatConfigListenerUnsubscribe) {
        const realtimeAPI = RealtimeAPI.getInstance();
        const path = `/chat-rooms/${this.chatRoom._id}/channels/${this.channel._id}`;

        this.chatConfigListenerUnsubscribe = realtimeAPI.listenToChatConfigChanges(path, (nextChatRoom) => {
          this.onChatChanges(nextChatRoom);
          this.onPinMessageChanges(nextChatRoom?.pinnedMessageId || null);
        });
      }

      return () => {
        this.offChatConfigListener(callback, callbackType);
      };
    } catch (e) {
      throw new Error('Cannot listen to chat config changes');
    }
  }

  /**
   * Update channel
   *
   */
  private updateChannelChatConfig(newChannel: LiveChatChannel): void {
    this.channel = newChannel;
  }

  /**
   * Remove all chat config listeners
   *
   */
  public offAllChatConfigListeners(): void {
    try {
      if (this.chatConfigListenerUnsubscribe) {
        this.chatConfigListenerUnsubscribe();
        this.chatConfigListenerUnsubscribe = null;
      }

      this.chatConfigChangesCallbacks[ChatConfigType.ALL_CHAT_CHANGES] = [];
      this.chatConfigChangesCallbacks[ChatConfigType.PIN_MESSAGES] = [];
    } catch (err) {
      throw new Error('Cannot off chat config changes');
    }
  }

  /**
   * Watch new config changes on chat
   *
   */
  private onChatChanges(nextChatRoom: LiveChatChannel): void {
    const newChannel = {
      ...nextChatRoom,
      _id: this.channel._id,
      dataPath: this.channel.dataPath,
    };

    if (this.chatConfigChangesCallbacks[ChatConfigType.ALL_CHAT_CHANGES]) {
      this.chatConfigChangesCallbacks[ChatConfigType.ALL_CHAT_CHANGES].forEach((callback) => {
        callback(newChannel);
      });
    }
  }

  /**
   * Watch pin message changes on chat
   *
   */
  private async onPinMessageChanges(newPinnedMessageId: string | null): Promise<void> {
    let pinnedMessageData: ChatMessage | null = null;

    if (this.pinnedMessageId !== newPinnedMessageId) {
      this.pinnedMessageId = newPinnedMessageId;

      if (newPinnedMessageId) {
        pinnedMessageData = await this.fetchPinMessage();
      }

      if (this.chatConfigChangesCallbacks[ChatConfigType.PIN_MESSAGES]) {
        this.chatConfigChangesCallbacks[ChatConfigType.PIN_MESSAGES].forEach((callback) => {
          callback(pinnedMessageData as ChatMessage);
        });
      }
    }
  }
}
