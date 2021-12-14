import {
  GroupChannel,
  ChatMessage,
  MessageChangeType,
  ChatMessageContent,
  BasePrivateChannel,
  PrivateMessageInput,
} from '@arena-im/chat-types';
import { User, OrganizationSite } from '@arena-im/core';
import { GraphQLAPI } from '../services/graphql-api';
import { RealtimeAPI } from '../services/realtime-api';

export class PrivateChannel implements BasePrivateChannel {
  private cacheCurrentMessages: ChatMessage[] = [];
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListenerUnsubscribe: (() => void) | null = null;
  private loadRecentMessagesCalled = false;
  private totalLimit: number | null = null;
  private fetchPreviousMessagesPromise = false;

  public constructor(private groupChannel: GroupChannel) {}

  /**
   * Get a group channel by id
   *
   * @param id GroupChannel id
   */
  static async getGroupChannel(id: string): Promise<GroupChannel> {
    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const groupChannel = await graphQLAPI.fetchGroupChannel(id);
      return groupChannel;
    } catch (e) {
      throw new Error(`Cannot get the "${id}" group channel.`);
    }
  }

  /**
   * Unblock a private user
   *
   * @param userId the userid of the user that the current user wants to unblock
   */
  static async unblockPrivateUser(userId: string): Promise<boolean> {
    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const result = await graphQLAPI.unblockPrivateUser(userId);
      return result;
    } catch (e) {
      throw new Error(`Cannot unblock the user: "${userId}".`);
    }
  }

  /**
   * Block a private user
   *
   * @param userId the userid of the user that the current user wants to block
   */
  static async blockPrivateUser(userId: string): Promise<boolean> {
    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const result = await graphQLAPI.blockPrivateUser(userId);
      return result;
    } catch (e) {
      throw new Error(`Cannot block the user: "${userId}".`);
    }
  }

  /**
   * Get User Channels
   *
   */
  static async getUserChannels(): Promise<GroupChannel[]> {
    const user = User.instance.data;

    if (user === null) {
      throw new Error('Cannot channels without a user');
    }

    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const groupChannel = await graphQLAPI.fetchGroupChannels();

      return groupChannel;
    } catch (e) {
      throw new Error(`Cannot the channels for the user: "${user.id}".`);
    }
  }

  /**
   * Watch unread messages count
   *
   * @param callback callback with total
   */
  static onUnreadMessagesCountChanged(callback: (total: number) => void): () => void {
    const user = User.instance.data;

    if (user === null) {
      throw new Error('Cannot get unread messages count without a user');
    }

    try {
      const realtimeAPI = RealtimeAPI.getInstance();
      const unsubscribe = realtimeAPI.listenToUserGroupChannels(user, async () => {
        const graphQLAPI = await GraphQLAPI.instance;

        const totalUnreadMessages = await graphQLAPI.fetchGroupChannelTotalUnreadCount();

        callback(totalUnreadMessages);
      });

      return unsubscribe;
    } catch (e) {
      throw new Error(`Cannot watch unread messages count for the user: "${user.id}".`);
    }
  }

  /**
   * Create a private user channel
   *
   * @param options create user options
   */
  static async createUserChannel(options: {
    userId: string;
    firstMessage?: ChatMessageContent | undefined;
  }): Promise<BasePrivateChannel> {
    const user = User.instance.data;

    if (user === null) {
      throw new Error('Cannot get unread messages count without a user');
    }

    const site = await OrganizationSite.instance.getSite();

    if (site === null) {
      throw new Error('Cannot create a channel without a site id');
    }

    if (!user?.token) {
      throw new Error('Cannot create a channel without a user');
    }

    try {
      const graphQLAPI = await GraphQLAPI.instance;

      const groupChannel = await graphQLAPI.createGroupChannel({
        userIds: [options.userId],
        siteId: site._id,
        firstMessage: options.firstMessage,
      });

      return new PrivateChannel(groupChannel);
    } catch (e) {
      throw new Error(`Cannot create a channel for with this user: "${options.userId}".`);
    }
  }

  /**
   * Mark all messages on this channel as read.
   */
  public async markRead(): Promise<boolean> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.markGroupChannelRead(this.groupChannel._id);

      return result;
    } catch (e) {
      throw new Error('Cannot set group channel read.');
    }
  }

  /**
   * Delete a private message
   *
   * @param messageId ChatMessage id
   */
  public async deleteMessage(messageId: string): Promise<boolean> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.deletePrivateMessage(this.groupChannel._id, messageId);

      return result;
    } catch (e) {
      throw new Error(`Cannot delete this message: "${messageId}".`);
    }
  }

  /**
   * Remove all message for the current user
   */
  public async removeAllMessages(): Promise<boolean> {
    const user = User.instance.data;

    if (user === null) {
      throw new Error('Cannot remove messages without a user');
    }

    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.removeGroupChannel(this.groupChannel._id);

      return result;
    } catch (e) {
      throw new Error(`Cannot remove all messages for this user: "${user.id}".`);
    }
  }

  /**
   * Send message on the channel
   *
   * @param message
   * @param replyMessageId message it's replying
   * @param tempId
   * @returns message id, temp id
   */
  public async sendMessage(message: ChatMessageContent, replyMessageId?: string, tempId?: string): Promise<string> {
    const user = User.instance.data;

    if (user === null) {
      throw new Error('Cannot send message without a user');
    }

    if (message.text?.trim() === '' && !message.media?.url) {
      throw new Error('Cannot send an empty message.');
    }

    const site = await OrganizationSite.instance.getSite();

    if (site === null) {
      throw new Error('Cannot send message without a site id');
    }

    try {
      const graphQLAPI = await GraphQLAPI.instance;

      const payload: PrivateMessageInput = {
        groupChannelId: this.groupChannel._id,
        message,
      };

      if (replyMessageId) {
        payload.replyTo = replyMessageId;
      }

      if (tempId) {
        payload.tempId = tempId;
      }

      const response = await graphQLAPI.sendPrivateMessage(payload);

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
      const messages = await this.fetchRecentMessages(limit);

      this.updateCacheCurrentMessages(messages);

      this.markRead();

      this.loadRecentMessagesCalled = true;

      return messages;
    } catch (e) {
      throw new Error(`Cannot load messages on "${this.groupChannel._id}" channel.`);
    }
  }

  private async fetchRecentMessages(limit?: number): Promise<ChatMessage[]> {
    return new Promise((resolve) => {
      this.listenToAllTypeMessageModification((messages) => {
        resolve(messages);
      }, limit);
    });
  }

  /**
   * Load previous messages on channel
   *
   * @param limit number of previous messages
   */
  public async loadPreviousMessages(limit?: number): Promise<ChatMessage[]> {
    if (!this.loadRecentMessagesCalled) {
      throw new Error('You should call the loadRecentMessages method first.');
    }

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

          this.updateCacheCurrentMessages(messages.concat(this.cacheCurrentMessages));

          this.fetchPreviousMessagesPromise = false;

          resolve(messages);
        }, limit);
      });
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
        const user = User.instance.data;

        if (user === null) {
          throw new Error('Cannot send message without a user');
        }

        if (this.cacheCurrentMessages.some((message) => newMessage.key === message.key)) {
          return;
        }

        const messages = this.cacheCurrentMessages.concat(newMessage);

        this.updateCacheCurrentMessages(messages);

        if (user.id !== newMessage.sender?._id) {
          this.markRead();
        }

        callback(newMessage);
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
            if (message.currentUserReactions) {
              modifiedMessage.currentUserReactions = message.currentUserReactions;
            }

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
    this.messageModificationListenerUnsubscribe = realtimeAPI.listenToGroupMessageReceived(
      this.groupChannel._id,
      (message) => {
        if (message.changeType === undefined || !this.messageModificationCallbacks[message.changeType]) {
          return;
        }

        this.messageModificationCallbacks[message.changeType].forEach((messageModificationCallback) =>
          messageModificationCallback(message),
        );
      },
      callback,
      this.totalLimit ?? undefined,
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
}
