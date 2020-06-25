import { RestAPI } from './services/rest-api';
import { Status } from './models/status';
import { Channel } from './channel/channel';
import { ExternalUser } from './models/user';
import { Site } from './models/site';
import { DEFAULT_AUTH_TOKEN, CACHED_API } from './config';

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
  public user: ExternalUser | null = null;
  public site: Site | null = null;
  public restAPI: RestAPI;
  private defaultAuthToken = DEFAULT_AUTH_TOKEN;

  public constructor(private apiKey: string) {
    this.restAPI = new RestAPI({ authToken: this.defaultAuthToken });
  }

  /**
   * Get a Arena Chat Channel
   *
   * @param channel Chat slug
   */
  public async getChannel(channel: string): Promise<Channel> {
    const restAPI = new RestAPI({ url: CACHED_API });

    try {
      const { chatRoom, site } = await restAPI.loadChatRoom(this.apiKey, channel);

      this.site = site;

      return new Channel(chatRoom, this);
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e === Status.Invalid) {
        erroMessage = `Invalid site (${this.apiKey}) or channel (${channel}) slugs.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async setUser(user: ExternalUser | null): Promise<ExternalUser | null> {
    if (user === null) {
      this.user = null;
      this.restAPI = new RestAPI({ authToken: this.defaultAuthToken });

      return null;
    }

    const [givenName, ...familyName] = user.name.split(' ');

    const token = await this.restAPI.getArenaUser({
      provider: this.apiKey,
      username: user.id,
      profile: {
        urlName: `${+new Date()}`,
        email: user.email,
        username: user.id,
        displayName: user.name,
        name: {
          familyName: familyName.join(' '),
          givenName,
        },
        profileImage: user.image,
        id: user.id,
      },
    });

    this.user = {
      ...user,
      token,
    };

    this.restAPI = new RestAPI({ authToken: token });

    return this.user;
  }
}
