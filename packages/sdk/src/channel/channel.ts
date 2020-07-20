import { ChatMessage, ChatRoom, MessageChangeType, Reaction } from '@arena-im/chat-types';
import { RealtimeAPI } from '../services/realtime-api';
import { ArenaChat } from '../sdk';

export class Channel {
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentMessages: ChatMessage[] = [];
  private messageModificationCallbacks: { [type: string]: ((message: ChatMessage) => void)[] } = {};
  private messageModificationListener: (() => void) | null = null;

  public constructor(public chatRoom: ChatRoom, private sdk: ArenaChat) {
    if (this.sdk.site === null) {
      throw new Error('Cannot create a channel without a site.');
    }

    this.realtimeAPI = new RealtimeAPI(chatRoom._id);

    this.watchChatConfigChanges();
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
      throw new Error('Cannot send message without an user');
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
   * Load recent messages on channel
   *
   * @param limit number of last messages
   */
  public async loadRecentMessages(limit?: number): Promise<ChatMessage[]> {
    try {
      const messages = await this.realtimeAPI.fetchRecentMessages(limit);

      this.cacheCurrentMessages = messages;

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

      this.cacheCurrentMessages = messages;

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
  public async sendLikeReaction(messageId: string): Promise<void> {
    if (this.sdk.site === null) {
      throw new Error('Cannot react to a message without a site id');
    }

    if (typeof messageId === 'undefined') {
      throw new Error('Invalid message id');
    }

    if (this.sdk.user === null) {
      throw new Error('Cannot react to a message without an user');
    }

    try {
      const reaction: Reaction = {
        itemType: 'chatMessage',
        reaction: 'love',
        publisherId: this.sdk.site._id,
        itemId: messageId,
        chatRoomId: this.chatRoom._id,
        userId: this.sdk.user.id,
      };

      await this.realtimeAPI.sendReaction(reaction);
    } catch (e) {
      throw new Error(`Cannot react to the message "${messageId}"`);
    }
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

        callback(newMessage);
      }, MessageChangeType.ADDED);
    } catch (e) {
      throw new Error(`Cannot watch new messages on "${this.chatRoom.slug}" channel.`);
    }
  }

  /**
   * Watch messages deleted
   *
   * @param callback
   */
  public onMessageDeleted(callback: (message: ChatMessage) => void): void {
    try {
      this.registerMessageModificationCallback(callback, MessageChangeType.REMOVED);
    } catch (e) {
      throw new Error(`Cannot watch deleted messages on "${this.chatRoom.slug}" channel.`);
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

    this.messageModificationListener = this.realtimeAPI.listenToMessageReceived((message) => {
      if (
        message.changeType === undefined ||
        !this.messageModificationCallbacks[message.changeType] ||
        (message.changeType !== MessageChangeType.ADDED && message.changeType !== MessageChangeType.REMOVED)
      ) {
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
