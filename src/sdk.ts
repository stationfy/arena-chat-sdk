import { RestAPI } from './services/rest-api';
import { ChatRoom } from './types/chat-room';
import { ChatMessage } from './types/chat-message';
import { Site } from './types/site';

/**
 * Chat SDK Client
 *
 * To use this SDK, call the {@link ArenaChat} function as early as possible when
 * loading the web page.
 *
 * @example
 *
 * ```
 *
 * import ArenaChat from '@arenaim/arena-chat-sdk';
 *
 * const arenaChat = new ArenaChat('API_KEY')
 * const channel = await arenaChat.getChannel('sdwe')
 * channel.sendMessage({
 * })
 *```
 */
export class ArenaChat {
  public constructor(private apiKey: string) {}

  /**
   * Get a Arena Chat Channel
   *
   * @param channel Chat slug
   */
  public async getChannel(channel: string) {
    const restAPI = new RestAPI({ url: 'https://cached-api-dev.arena.im/v1' });

    const { chatRoom, site } = await restAPI.loadChatRoom(this.apiKey, channel);

    return new Channel(chatRoom, site);
  }
}

class Channel {
  private restAPI: RestAPI;

  public constructor(private chatRoom: ChatRoom, private site: Site) {
    const authToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NGQ5OGJiNmY3MDIyOGU4MWI4Njc5YmUiLCJyb2xlcyI6WyJVU0VSIl0sImV4cCI6MzM2OTQxODM2OSwiaWF0IjoxNDc3MjU4MzY5fQ.dNpdrs3ehrGAhnPFIlWMrQFR4mCFKZl_Lvpxk1Ddp4o';
    this.restAPI = new RestAPI({ authToken });
  }

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

    const response = await this.restAPI.sendMessage(this.chatRoom, chatMessage);

    return response;
  }
}
