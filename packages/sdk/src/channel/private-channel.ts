import { ExternalUser, GroupChannel, ChatMessage, MessageChangeType, Site } from '@arena-im/chat-types';
import { GraphQLAPI } from '../services/graphql-api';
import { BasePrivateChannel } from '../interfaces/base-private-channel';
import { RealtimeAPI } from '../services/realtime-api';

export class PrivateChannel implements BasePrivateChannel {
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentMessages: ChatMessage[] = [];
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListener: (() => void) | null = null;

  public constructor(private channelId: string) {
    this.realtimeAPI = new RealtimeAPI(channelId);
  }

  static getUserChannels(user: ExternalUser, site: Site): Promise<GroupChannel[]> {
    const graphQLAPI = new GraphQLAPI(user, site);

    return graphQLAPI.fetchGroupChannels();
  }

  static async createUserChannel(user: ExternalUser, userId: string, site: Site): Promise<BasePrivateChannel> {
    const graphQLAPI = new GraphQLAPI(user, site);

    const groupChannel = await graphQLAPI.createGroupChannel({
      userIds: [userId],
      siteId: site._id,
    });

    return new PrivateChannel(groupChannel._id);
  }

  /**
   * Load recent messages on channel
   *
   * @param limit number of last messages
   */
  public async loadRecentMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      const messages = await this.realtimeAPI.fetchGroupRecentMessages(limit);

      this.updateCacheCurrentMessages(messages);

      return messages;
    } catch (e) {
      throw new Error(`Cannot load messages on "${this.channelId}" channel.`);
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

      const messages = await this.realtimeAPI.fetchGroupPreviousMessages(firstMessage, limit);

      this.updateCacheCurrentMessages([...messages, ...this.cacheCurrentMessages]);

      return messages;
    } catch (e) {
      throw new Error(`Cannot load previous messages on "${this.channelId}" channel.`);
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
      }, MessageChangeType.ADDED);
    } catch (e) {
      throw new Error(`Cannot watch new messages on "${this.channelId}" channel.`);
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
