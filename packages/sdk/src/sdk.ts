import { Status, ExternalUser, Site, UserChangedListener } from '@arena-im/chat-types';
import { RestAPI } from './services/rest-api';
import { Channel } from './channel/channel';
import { DEFAULT_AUTH_TOKEN, CACHED_API } from './config';
import { PrivateChannel } from './channel/private-channel';

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
  public privateChannel: PrivateChannel | null = null;
  private defaultAuthToken = DEFAULT_AUTH_TOKEN;
  private currentChannels: Channel[] = [];
  private userChangedListeners: UserChangedListener[] = [];

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

      const channelI = new Channel(chatRoom, this);

      this.currentChannels.push(channelI);

      return channelI;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e === Status.Invalid) {
        erroMessage = `Invalid site (${this.apiKey}) or channel (${channel}) slugs.`;
      }

      throw new Error(erroMessage);
    }
  }

  /**
   * Whatch set a new user
   *
   * @param callback
   */
  public onUserChanged(callback: UserChangedListener): void {
    if (typeof callback !== 'function') {
      return;
    }

    this.userChangedListeners.push(callback);
  }

  /**
   * Set a external user
   *
   * @param user external user
   */
  public async setUser(user: ExternalUser | null): Promise<ExternalUser | null> {
    if (user === null) {
      this.unsetUser();

      return null;
    }

    const createdUser = await this.setNewUser(user);

    if (createdUser.token) {
      this.setRestAPIAuthToken(createdUser.token);
    }

    this.callChangedUserListeners(createdUser);

    this.privateChannel = new PrivateChannel(createdUser);

    return this.user;
  }

  /**
   * Call all changed user listeners
   *
   * @param user created user
   */
  private callChangedUserListeners(user: ExternalUser): void {
    this.userChangedListeners.forEach((listener) => {
      listener(user);
    });
  }

  /**
   * Unset user
   *
   */
  private unsetUser(): void {
    this.user = null;
    this.restAPI = new RestAPI({ authToken: this.defaultAuthToken });
  }

  /**
   * Set a new user
   *
   * @param user external user
   */
  private async setNewUser(user: ExternalUser): Promise<ExternalUser> {
    const [givenName, ...familyName] = user.name.split(' ');

    const result = await this.restAPI.getArenaUser({
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
      metadata: user.metaData,
    });

    this.user = {
      ...user,
      token: result.token,
      isModerator: result.isModerator,
      isBanned: result.isBanned,
    };

    return this.user;
  }

  private setRestAPIAuthToken(token: string): void {
    this.restAPI = new RestAPI({ authToken: token });
  }
}
