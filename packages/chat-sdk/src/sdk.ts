import {
  Status,
  ExternalUser,
  GroupChannel,
  ChatMessageContent,
  BaseUserProfile,
  PublicUser,
  PublicUserInput,
} from '@arena-im/chat-types';
import { User, Credentials } from '@arena-im/core';
import { Config as CoreConfig } from '@arena-im/core/dist/config';

import { LiveChat } from './live-chat/live-chat';
import Config, { AreaProperties, EnvType } from '@arena-im/config-sdk';
/**
 * Chat SDK Client
 *
 * To use this SDK, call the {@link ArenaChat} function as early as possible when
 * loading the web page
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
  private unsubscribeOnUnreadMessagesCountChanged: (() => void) | undefined;
  private userProfileI: BaseUserProfile | null = null;

  public constructor({apiKey, region = 'USA', envs} : { apiKey: string, region?: AreaProperties, envs?: EnvType}) {
    Config.instance.region = region
    CoreConfig.instance.region = region
    if(envs){
      Config.instance.enviroment = envs
      CoreConfig.instance.enviroment = envs
    }
    Credentials.apiKey = apiKey;
  }

  /**
   * Get the current user profile
   */
  public async getMeProfile(): Promise<PublicUser> {
    if (User.instance.data === null) {
      throw new Error('You have to set a user before get the current user profile.');
    }

    if (this.userProfileI === null) {
      const { UserProfile } = await import('./user-profile/user-profile');

      this.userProfileI = new UserProfile();
    }

    return this.userProfileI.getMeProfile();
  }

  /**
   * Get the user profile by a user id
   *
   * @param userId
   */
  public async getUserProfile(userId: string): Promise<PublicUser> {
    if (this.userProfileI === null) {
      const { UserProfile } = await import('./user-profile/user-profile');

      this.userProfileI = new UserProfile();
    }

    return this.userProfileI.getUserProfile(userId);
  }

  public async updateUserProfile(userInput: PublicUserInput): Promise<PublicUser> {
    if (User.instance.data === null) {
      throw new Error('You have to set a user before update the user profile.');
    }

    if (this.userProfileI === null) {
      const { UserProfile } = await import('./user-profile/user-profile');

      this.userProfileI = new UserProfile();
    }

    return this.userProfileI.updateUserProfile(userInput);
  }

  /**
   * Block a user for the current user on private channels
   *
   * @param userId block the userId for the current user
   */
  public async blockPrivateUser(userId: string): Promise<boolean> {
    if (User.instance.data === null) {
      throw new Error('Cannot block a user without a current user.');
    }

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.blockPrivateUser(userId);
  }

  /**
   * Unblock a user for the current user on private channels
   *
   * @param userId unblock the userId for the current user
   */
  public async unblockPrivateUser(userId: string): Promise<boolean> {
    if (User.instance.data === null) {
      throw new Error('Cannot unblock a user without a current user.');
    }

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.unblockPrivateUser(userId);
  }

  /**
   * Watch unread private messages on the current site for the current user
   *
   * @param callback
   */
  public async onUnreadPrivateMessagesCountChanged(callback: (total: number) => void): Promise<() => void> {
    if (User.instance.data === null) {
      throw new Error('Cannot listen to unread private messages without a current user.');
    }

    const { PrivateChannel } = await import('./channel/private-channel');

    const unsubscribe = PrivateChannel.onUnreadMessagesCountChanged(callback);
    this.unsubscribeOnUnreadMessagesCountChanged = unsubscribe;

    return unsubscribe;
  }

  /**
   * Unlisten to onUnreadMessagesCountChanged listener
   */
  public offUnreadMessagesCountChanged(callback?: (result: boolean) => void): void {
    if (this.unsubscribeOnUnreadMessagesCountChanged) {
      this.unsubscribeOnUnreadMessagesCountChanged();

      callback?.(true);
    } else {
      callback?.(false);
    }
  }

  /**
   * Get a Arena Private Chat Channel
   *
   * @param channelId
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async getPrivateChannel(channelId: string) {
    if (User.instance.data === null) {
      throw new Error('Cannot get a private channel without a current user.');
    }

    const { PrivateChannel } = await import('./channel/private-channel');

    const groupChannel = await PrivateChannel.getGroupChannel(channelId);

    return new PrivateChannel(groupChannel);
  }

  /**
   * Get all user's private channels
   */
  public async getUserPrivateChannels(): Promise<GroupChannel[]> {
    if (User.instance.data === null) {
      throw new Error('Cannot get the list of private channels without a current user.');
    }

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.getUserChannels();
  }

  /**
   * Create a new private channel or return an exist one
   *
   * @param userId
   * @param firstMessage
   */
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  public async createUserPrivateChannel(userId: string, firstMessage?: ChatMessageContent) {
    if (User.instance.data === null) {
      throw new Error('Cannot create a private channel without a current user.');
    }

    const { PrivateChannel } = await import('./channel/private-channel');

    return PrivateChannel.createUserChannel({ userId, firstMessage });
  }

  /**
   * Get live chat by slug
   *
   * @param slug
   */
  public async getLiveChat(slug: string): Promise<LiveChat> {
    try {
      const liveChat = await LiveChat.getInstance(slug);

      return liveChat;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e === Status.Invalid) {
        erroMessage = `Invalid site (${Credentials.apiKey}) or live chat (${slug}) slugs.`;
      }

      throw new Error(erroMessage);
    }
  }

  /**
   * Set a external user
   *
   * @param user external user
   */
  public async setUser(externalUser: ExternalUser | null): Promise<ExternalUser | null> {
    if (externalUser === null) {
      User.instance.unsetUser();

      return null;
    }

    const createdUser = await User.instance.setNewUser(externalUser);

    return createdUser;
  }

  public setInternalUser(externalUser: ExternalUser): ExternalUser | null {
    if (externalUser === null) {
      User.instance.unsetUser();

      return null;
    }

    return User.instance.setInternalUser(externalUser);
  }
}
