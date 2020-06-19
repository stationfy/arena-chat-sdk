import { ChatMessage } from '../types/chat-message';
import { RestAPI } from '../services/rest-api';
import { ChatRoom } from '../types/chat-room';
import { Site } from '../types/site';
import { RealtimeAPI } from '../services/realtime-api';

export class Channel {
  private restAPI: RestAPI;
  private realtimeAPI: RealtimeAPI;

  public constructor(public chatRoom: ChatRoom, private site: Site) {
    const authToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NGQ5OGJiNmY3MDIyOGU4MWI4Njc5YmUiLCJyb2xlcyI6WyJVU0VSIl0sImV4cCI6MzM2OTQxODM2OSwiaWF0IjoxNDc3MjU4MzY5fQ.dNpdrs3ehrGAhnPFIlWMrQFR4mCFKZl_Lvpxk1Ddp4o';
    this.restAPI = new RestAPI({ authToken });

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
    const chatMessage: ChatMessage = {
      message: {
        text,
      },
      publisherId: this.site._id,
      sender: {
        photoURL: 'https://randomuser.me/api/portraits/women/12.jpg',
        displayName: 'Kristin Mckinney',
        anonymousId: '123456',
      },
    };

    try {
      const response = await this.restAPI.sendMessage(this.chatRoom, chatMessage);

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
