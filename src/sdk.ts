import { RestAPI } from './services/rest-api';
import { ChatRoom } from './types/chat-room';
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
 * new ArenaChat('API_KEY')
 *```
 */
export class ArenaChat {
  private chatRoom: ChatRoom | undefined;
  private site: Site | undefined;

  public constructor(private apiKey: string) {
    console.log(this.apiKey);
  }

  /**
   * Get a Arena Chat Channel
   *
   * @param channel Chat slug
   */
  public async getChannel(channel: string) {
    const restAPI = new RestAPI({ url: 'https://cached-api-dev.arena.im/v1' });

    const { chatRoom, site } = await restAPI.loadChatRoom(this.apiKey, channel);

    this.chatRoom = chatRoom;
    this.site = site;

    console.log(this.chatRoom);
    console.log(this.site);
  }
}
