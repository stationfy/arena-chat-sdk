import { ChatMessage } from '../models/chat-message';
import { ChatRoom } from '../models/chat-room';
import { RealtimeAPI } from '../services/realtime-api';
import { ArenaChat } from '../sdk';

export class Channel {
  private realtimeAPI: RealtimeAPI;

  public constructor(public chatRoom: ChatRoom, private sdk: ArenaChat) {
    if (this.sdk.site === null) {
      throw new Error('Cannot create a channel without a site.');
    }

    this.realtimeAPI = new RealtimeAPI(chatRoom.id);

    this.watchChatConfigChanges();
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
        anonymousId: this.sdk.user.id,
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
      return messages;
    } catch (e) {
      throw new Error(`Cannot load the messages for "${this.chatRoom.slug}" channel.`);
    }
  }

  /**
   * Watch messages on channel
   *
   * @param callback
   */
  public watchNewMessage(callback: (message: ChatMessage) => void): void {
    try {
      this.realtimeAPI.listenToChatNewMessage(callback);
    } catch (e) {
      throw new Error(`Cannot watch new message on "${this.chatRoom.slug}" channel.`);
    }
  }
}
