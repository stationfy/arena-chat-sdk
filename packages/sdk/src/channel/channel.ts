import {
  ChatMessage,
  ChatRoom,
  MessageChangeType,
  ServerReaction,
  MessageReaction,
  ExternalUser,
  Moderation,
  BanUser,
  ChatMessageSender,
} from '@arena-im/chat-types';
import { RealtimeAPI } from '../services/realtime-api';
import { ArenaChat } from '../sdk';

export class Channel {
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentMessages: ChatMessage[] = [];
  private cacheUserReactions: { [key: string]: ServerReaction } = {};
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListener: (() => void) | null = null;
  private userReactionsSubscription: (() => void) | null = null;

  public constructor(public chatRoom: ChatRoom, private sdk: ArenaChat) {
    if (this.sdk.site === null) {
      throw new Error('Cannot create a channel without a site.');
    }

    this.realtimeAPI = new RealtimeAPI(chatRoom._id);

    this.watchChatConfigChanges();

    this.sdk.onUserChanged((user: ExternalUser) => this.watchUserChanged(user));
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

    try {
      return await this.sdk.restAPI.requestModeration(this.sdk.site, this.chatRoom);
    } catch (e) {
      throw new Error(`Cannot request moderation for user: "${this.sdk.user.id}". Contact the Arena support team.`);
    }
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
      await this.sdk.restAPI.banUser(requestUser);
    } catch (e) {
      throw new Error(
        `Cannot ban this user: "${requestUser.userId || requestUser.anonymousId}". Contact the Arena support team.`,
      );
    }
  }

  public async deleteMessage(message: ChatMessage): Promise<void> {
    if (this.sdk.site === null) {
      throw new Error('Cannot request moderation without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot ban a user without a user');
    }

    if (typeof message === 'undefined' || message === null) {
      throw new Error('You have to inform a message');
    }

    try {
      await this.sdk.restAPI.deleteMessage(this.sdk.site, this.chatRoom, message);
    } catch (e) {
      throw new Error(`Cannot delete this message: "${message.key}". Contact the Arena support team.`);
    }
  }

  /**
   * Send message on the channel
   *
   * @param text
   */
  public async sendMessage(text: string): Promise<ChatMessage> {
    if (text.trim() === '') {
      throw new Error('Cannot send an empty message.');
    }

    if (this.sdk.site === null) {
      throw new Error('Cannot send message without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot send message without a user');
    }

    const chatMessage: ChatMessage = {
      message: {
        text,
      },
      publisherId: this.sdk.site._id,
      sender: {
        photoURL: this.sdk.user.image,
        displayName: this.sdk.user.name,
        uid: this.sdk.user.id,
      },
    };

    try {
      const response = await this.sdk.restAPI.sendMessage(this.chatRoom, chatMessage);

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
  private watchUserChanged(user: ExternalUser) {
    this.watchUserReactions(user);
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
      this.cacheUserReactions = {};

      this.userReactionsSubscription = this.realtimeAPI.listenToUserReactions(user, (reactions) => {
        reactions.forEach((reaction) => {
          this.cacheUserReactions[reaction.itemId] = reaction;
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

      const reaction = this.cacheUserReactions[message.key];
      if (
        reaction &&
        (typeof message.currentUserReactions === 'undefined' || !message.currentUserReactions[reaction.reaction])
      ) {
        if (typeof message.currentUserReactions === 'undefined') {
          message.currentUserReactions = {};
        }

        message.currentUserReactions[reaction.reaction] = true;

        const modifiedCallbacks = this.messageModificationCallbacks[MessageChangeType.MODIFIED];
        if (typeof modifiedCallbacks !== 'undefined') {
          modifiedCallbacks.forEach((callback) => callback({ ...message }));
        }
      }
    });
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
      const messages = await this.realtimeAPI.fetchRecentMessages(limit);

      this.updateCacheCurrentMessages(messages);

      return messages;
    } catch (e) {
      throw new Error(`Cannot load messages on "${this.chatRoom.slug}" channel.`);
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

      const messages = await this.realtimeAPI.fetchPreviousMessages(firstMessage, limit);

      this.updateCacheCurrentMessages([...messages, ...this.cacheCurrentMessages]);

      return messages;
    } catch (e) {
      throw new Error(`Cannot load previous messages on "${this.chatRoom.slug}" channel.`);
    }
  }

  /**
   * Send a like reaction
   *
   * @param message chat message
   */
  public async sendReaction(reaction: MessageReaction): Promise<MessageReaction> {
    if (this.sdk.site === null) {
      throw new Error('Cannot react to a message without a site id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot react to a message without a user');
    }

    try {
      const serverReaction: ServerReaction = {
        itemType: 'chatMessage',
        reaction: reaction.type,
        publisherId: this.sdk.site._id,
        itemId: reaction.messageID,
        chatRoomId: this.chatRoom._id,
        userId: this.sdk.user.id,
      };

      const result = await this.realtimeAPI.sendReaction(serverReaction);

      return {
        id: result.key,
        type: result.reaction,
        messageID: result.itemId,
      };
    } catch (e) {
      throw new Error(`Cannot react to the message "${reaction.messageID}"`);
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
      throw new Error(`Cannot watch new messages on "${this.chatRoom.slug}" channel.`);
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
      throw new Error(`Cannot watch messages modified on "${this.chatRoom.slug}" channel.`);
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
      throw new Error(`Cannot watch deleted messages on "${this.chatRoom.slug}" channel.`);
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

    this.messageModificationListener = this.realtimeAPI.listenToMessageReceived((message) => {
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
  private watchChatConfigChanges() {
    try {
      this.realtimeAPI.listenToChatConfigChanges((nextChatRoom) => {
        this.chatRoom = nextChatRoom;
      });
    } catch (e) {
      throw new Error('Cannot listen to chat config changes');
    }
  }
}
