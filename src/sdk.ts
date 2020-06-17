import { RestAPI } from './services/rest-api';
import { Status } from './types/status';
import { Channel } from './channel/channel';

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
  public async getChannel(channel: string): Promise<Channel> {
    const restAPI = new RestAPI({ url: 'https://cached-api-dev.arena.im/v1' });

    try {
      const { chatRoom, site } = await restAPI.loadChatRoom(this.apiKey, channel);

      return new Channel(chatRoom, site);
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e === Status.Invalid) {
        erroMessage = `Invalid site (${this.apiKey}) or channel (${channel}) slugs.`;
      }

      throw new Error(erroMessage);
    }
  }
}
