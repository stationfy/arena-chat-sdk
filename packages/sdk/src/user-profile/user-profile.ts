import { BaseUserProfile, ExternalUser, PublicUser, PublicUserInput, Site, Status } from '@arena-im/chat-types';

import { ArenaChat } from '../sdk';
import { GraphQLAPI } from '../services/graphql-api';

export class UserProfile implements BaseUserProfile {
  private graphQLAPI: GraphQLAPI;

  public constructor(site: Site, private sdk: ArenaChat) {
    let currentUser: ExternalUser | undefined;

    if (this.sdk.user) {
      currentUser = this.sdk.user;
    }

    this.graphQLAPI = new GraphQLAPI(site, currentUser);

    this.sdk.onUserChanged((user: ExternalUser | null) => this.watchUserChanged(user));
  }

  /**
   * Watch user changed
   *
   * @param {ExternalUser} user external user
   */
  private watchUserChanged(user: ExternalUser | null) {
    if (this.sdk.site) {
      this.graphQLAPI = new GraphQLAPI(this.sdk.site, user || undefined);
    }
  }

  public async getMeProfile(): Promise<PublicUser> {
    const userId = this.sdk.user?.id;

    if (!userId) {
      throw new Error('You have to set a user before get the current user profile');
    }

    try {
      const user = await this.graphQLAPI.fetchUserProfile(userId);

      return user;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e.message === Status.Invalid) {
        erroMessage = `Invalid user (${userId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async getUserProfile(userId: string): Promise<PublicUser> {
    try {
      const user = await this.graphQLAPI.fetchUserProfile(userId);

      return user;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e.message === Status.Invalid) {
        erroMessage = `Invalid user (${userId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async updateUserProfile(user: PublicUserInput): Promise<PublicUser> {
    try {
      const updatedUser = await this.graphQLAPI.updateUser(user);

      return updatedUser;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e.message === Status.Invalid) {
        erroMessage = `Invalid user to update.`;
      }

      throw new Error(erroMessage);
    }
  }
}
