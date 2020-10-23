import {
  Status,
  ExternalUser,
  Site,
  UserChangedListener,
  GroupChannel,
  ChatRoom,
  ChatMessageContent,
  BasePrivateChannel,
  BaseQna,
} from '@arena-im/chat-types';
import { RestAPI } from './services/rest-api';
import { Channel } from './channel/channel';
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
  public mainChatRoom: ChatRoom | null = null;
  public restAPI: RestAPI;
  private defaultAuthToken = DEFAULT_AUTH_TOKEN;
  private currentChannels: Channel[] = [];
  private userChangedListeners: UserChangedListener[] = [];
  private unsubscribeOnUnreadMessagesCountChanged: (() => void) | undefined;

  public constructor(private apiKey: string) {
    this.restAPI = new RestAPI({ authToken: this.defaultAuthToken });
  }

  /**
   * Block a user for the current user on private channels
   *
   * @param userId block the userId for the current user
   */
  public async blockPrivateUser(userId: string): Promise<boolean> {
    if (this.user === null) {
      throw new Error('Cannot block a user without a current user.');
    }

    const site = await this.fetchAndSetSite();

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.blockPrivateUser(this.user, site, userId);
  }

  /**
   * Unblock a user for the current user on private channels
   *
   * @param userId unblock the userId for the current user
   */
  public async unblockPrivateUser(userId: string): Promise<boolean> {
    if (this.user === null) {
      throw new Error('Cannot unblock a user without a current user.');
    }

    const site = await this.fetchAndSetSite();

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.unblockPrivateUser(this.user, site, userId);
  }

  /**
   * Watch unread private messages on the current site for the current user
   *
   * @param callback
   */
  public async onUnreadPrivateMessagesCountChanged(callback: (total: number) => void): Promise<void> {
    if (this.user === null) {
      throw new Error('Cannot listen to unread private messages without a current user.');
    }

    const site = await this.fetchAndSetSite();

    const { PrivateChannel } = await import('./channel/private-channel');

    this.unsubscribeOnUnreadMessagesCountChanged = PrivateChannel.onUnreadMessagesCountChanged(
      this.user,
      site,
      callback,
    );
  }

  /**
   * Unlisten to onUnreadMessagesCountChanged listener
   */
  public offUnreadMessagesCountChanged(callback?: (result: boolean) => void): void {
    if (this.unsubscribeOnUnreadMessagesCountChanged) {
      this.unsubscribeOnUnreadMessagesCountChanged();

      if (typeof callback === 'function') callback(true);
    } else {
      if (typeof callback === 'function') callback(false);
    }
  }

  /**
   * Get a Arena Private Chat Channel
   *
   * @param channelId
   */
  public async getPrivateChannel(channelId: string): Promise<BasePrivateChannel> {
    if (this.user === null) {
      throw new Error('Cannot get a private channel without a current user.');
    }

    const site = await this.fetchAndSetSite();

    const { PrivateChannel } = await import('./channel/private-channel');

    const groupChannel = await PrivateChannel.getGroupChannel(site, this.user, channelId);

    return new PrivateChannel(groupChannel, site, this.user);
  }

  /**
   * Get all user's private channels
   */
  public async getUserPrivateChannels(): Promise<GroupChannel[]> {
    if (this.user === null) {
      throw new Error('Cannot get the list of private channels without a current user.');
    }

    const site = await this.fetchAndSetSite();

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.getUserChannels(this.user, site);
  }

  /**
   * Create a new private channel or return an exist one
   *
   * @param userId
   * @param firstMessage
   */
  public async createUserPrivateChannel(
    userId: string,
    firstMessage?: ChatMessageContent,
  ): Promise<BasePrivateChannel> {
    if (this.user === null) {
      throw new Error('Cannot create a private channel without a current user.');
    }

    const site = await this.fetchAndSetSite();

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.createUserChannel({ user: this.user, userId, site, firstMessage });
  }

  /**
   * Get a Arena Chat Q&A
   *
   * @param chatSlug
   */
  public async getChatQna(chatSlug: string): Promise<BaseQna> {
    const { chatRoom, site } = await this.fetchAndSetChatRoomAndSite(chatSlug);

    if (typeof chatRoom.qnaId === 'undefined') {
      throw new Error(`Cannot get the Q&A for this chat: "${chatSlug}"`);
    }

    const { Qna } = await import('./qna/qna');

    const qnaProps = await Qna.getQnaProps(chatRoom.qnaId);

    const qnaI = new Qna(qnaProps, chatRoom.qnaId, site, this);

    return qnaI;
  }

  /**
   * Get a Arena Chat Channel
   *
   * @param channel Chat slug
   */
  public async getChannel(channel: string): Promise<Channel> {
    try {
      const { chatRoom } = await this.fetchAndSetChatRoomAndSite(channel);

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

    return this.user;
  }

  public setInternalUser(user: ExternalUser): ExternalUser | null {
    if (user === null) {
      this.unsetUser();

      return null;
    }

    if (user.token) {
      this.setRestAPIAuthToken(user.token);
    }

    this.callChangedUserListeners(user);

    this.user = user;

    return this.user;
  }

  private async fetchAndSetChatRoomAndSite(channel: string): Promise<{ chatRoom: ChatRoom; site: Site }> {
    if (this.mainChatRoom !== null && this.site !== null) {
      return { chatRoom: this.mainChatRoom, site: this.site };
    }

    const restAPI = new RestAPI({ url: CACHED_API });

    const { chatRoom, site, settings } = await restAPI.loadChatRoom(this.apiKey, channel);

    this.mainChatRoom = chatRoom;

    site.settings = settings;
    this.site = site;

    return { chatRoom, site };
  }

  private async fetchAndSetSite(): Promise<Site> {
    if (this.site !== null) {
      return this.site;
    }

    const restAPI = new RestAPI({ url: CACHED_API });

    const site = await restAPI.loadSite(this.apiKey);

    this.site = site;

    return site;
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
