import { RestAPI } from '@services/rest-api';
import { Status } from '@models/status';
import { Channel } from '@channel/channel';
import { ExternalUser } from '@models/user';
import { Site } from '@models/site';

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

  public constructor(private apiKey: string) {
    const authToken =
      'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJfaWQiOiI1NGQ5OGJiNmY3MDIyOGU4MWI4Njc5YmUiLCJyb2xlcyI6WyJVU0VSIl0sImV4cCI6MzM2OTQxODM2OSwiaWF0IjoxNDc3MjU4MzY5fQ.dNpdrs3ehrGAhnPFIlWMrQFR4mCFKZl_Lvpxk1Ddp4o';
    this.restAPI = new RestAPI({ authToken });
  }

  /**
   * Get a Arena Chat Channel
   *
   * @param channel Chat slug
   */
  public async getChannel(channel: string): Promise<Channel> {
    const restAPI = new RestAPI({ url: 'https://cached-api-dev.arena.im/v1' });

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

  public async setUser(user: ExternalUser): Promise<ExternalUser> {
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
