import {
  ExternalUser,
  GroupChannel,
  ChatMessage,
  MessageChangeType,
  Site,
  ChatMessageContent,
  BasePrivateChannel,
} from '@arena-im/chat-types';
import { GraphQLAPI } from '../services/graphql-api';
import { RealtimeAPI } from '../services/realtime-api';

export class PrivateChannel implements BasePrivateChannel {
  private realtimeAPI: RealtimeAPI;
  private graphQLAPI: GraphQLAPI;
  private cacheCurrentMessages: ChatMessage[] = [];
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListener: (() => void) | null = null;

  public constructor(private groupChannel: GroupChannel, private site: Site, private user: ExternalUser) {
    this.realtimeAPI = new RealtimeAPI(groupChannel._id);
    this.graphQLAPI = new GraphQLAPI(site, user);
  }

  static async getGroupChannel(site: Site, user: ExternalUser, id: string): Promise<GroupChannel> {
    const graphQLAPI = new GraphQLAPI(site, user);

    return graphQLAPI.fetchGroupChannel(id);
  }

  static async unblockPrivateUser(user: ExternalUser, site: Site, userId: string): Promise<boolean> {
    const graphQLAPI = new GraphQLAPI(site, user);

    return graphQLAPI.unblockPrivateUser(userId);
  }

  static async blockPrivateUser(user: ExternalUser, site: Site, userId: string): Promise<boolean> {
    const graphQLAPI = new GraphQLAPI(site, user);

    return graphQLAPI.blockPrivateUser(userId);
  }

  static getUserChannels(user: ExternalUser, site: Site): Promise<GroupChannel[]> {
    const graphQLAPI = new GraphQLAPI(site, user);

    return graphQLAPI.fetchGroupChannels();
  }

  static onUnreadMessagesCountChanged(user: ExternalUser, site: Site, callback: (total: number) => void): void {
    const realtimeAPI = new RealtimeAPI();
    realtimeAPI.listenToUserGroupChannels(user, async () => {
      const graphQLAPI = new GraphQLAPI(site, user);

      const totalUnreadMessages = await graphQLAPI.fetchGroupChannelTotalUnreadCount();

      callback(totalUnreadMessages);
    });
  }

  static async createUserChannel(options: {
    user: ExternalUser;
    userId: string;
    site: Site;
    firstMessage?: ChatMessageContent;
  }): Promise<BasePrivateChannel> {
    if (!options.user?.token) {
      throw new Error('Cannot create a channel without a user');
    }

    const graphQLAPI = new GraphQLAPI(options.site, options.user);

    const groupChannel = await graphQLAPI.createGroupChannel({
      userIds: [options.userId],
      siteId: options.site._id,
      firstMessage: options.firstMessage,
    });

    return new PrivateChannel(groupChannel, options.site, options.user);
  }

  public async markRead(): Promise<boolean> {
    try {
      return this.graphQLAPI.markGroupChannelRead(this.groupChannel._id);
    } catch (e) {
      console.error('Cannot set group channel read.');
      return false;
    }
  }

  public async deleteMessage(messageId: string): Promise<boolean> {
    return this.graphQLAPI.deletePrivateMessage(this.groupChannel._id, messageId);
  }

  public async removeAllMessages(): Promise<boolean> {
    return this.graphQLAPI.removeGroupChannel(this.groupChannel._id);
  }

  /**
   * Send message on the channel
   *
   * @param {ChatMessageContent} message
   * @returns {string} message id
   */
  public async sendMessage(message: ChatMessageContent, replyMessageId?: string): Promise<string> {
    if (message.text?.trim() === '' && !message.media?.url) {
      throw new Error('Cannot send an empty message.');
    }

    if (this.site === null) {
      throw new Error('Cannot send message without a site id');
    }

    if (this.user === null) {
      throw new Error('Cannot send message without a user');
    }

    try {
      const response = await this.graphQLAPI.sendPrivateMessage({
        groupChannelId: this.groupChannel._id,
        message,
        replyTo: replyMessageId,
      });

      return response;
    } catch (e) {
      throw new Error(`Cannot send this message: "${message.text}". Contact the Arena support team.`);
    }
  }

  /**
   * Load recent messages on channel
   *
   * @param limit number of last messages
   */
  public async loadRecentMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      const messages = await this.realtimeAPI.fetchGroupRecentMessages(limit, this.groupChannel.lastClearedTimestamp);

      this.updateCacheCurrentMessages(messages);

      this.markRead();

      return messages;
    } catch (e) {
      throw new Error(`Cannot load messages on "${this.groupChannel._id}" channel.`);
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

      const messages = await this.realtimeAPI.fetchGroupPreviousMessages(
        firstMessage,
        this.groupChannel.lastClearedTimestamp,
        limit,
      );

      this.updateCacheCurrentMessages([...messages, ...this.cacheCurrentMessages]);

      return messages;
    } catch (e) {
      throw new Error(`Cannot load previous messages on "${this.groupChannel._id}" channel.`);
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

        callback(newMessage);

        this.markRead();
      }, MessageChangeType.ADDED);
    } catch (e) {
      throw new Error(`Cannot watch new messages on "${this.groupChannel._id}" channel.`);
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
      throw new Error(`Cannot watch deleted messages on "${this.groupChannel._id}" channel.`);
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
          if (message.key === modifiedMessage.key) {
            modifiedMessage.currentUserReactions = message.currentUserReactions;
            return modifiedMessage;
          }

          return message;
        });

        this.updateCacheCurrentMessages(messages);

        callback(modifiedMessage);
      }, MessageChangeType.MODIFIED);
    } catch (e) {
      throw new Error(`Cannot watch messages modified on "${this.groupChannel._id}" channel.`);
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
    if (this.messageModificationListener !== null) {
      return;
    }

    this.messageModificationListener = this.realtimeAPI.listenToGroupMessageReceived((message) => {
      if (message.changeType === undefined || !this.messageModificationCallbacks[message.changeType]) {
        return;
      }

      this.messageModificationCallbacks[message.changeType].forEach((callback) => callback(message));
    });
  }

  /**
   * Update the cache of current messages
   *
   * @param {ChatMessage[]} messages updated messages
   */
  private updateCacheCurrentMessages(messages: ChatMessage[]): void {
    this.cacheCurrentMessages = messages;
  }
}
