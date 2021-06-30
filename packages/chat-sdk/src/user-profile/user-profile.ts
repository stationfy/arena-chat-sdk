import { BaseUserProfile, PublicUser, PublicUserInput, Status } from '@arena-im/chat-types';
import { User } from '@arena-im/core';

import { GraphQLAPI } from '../services/graphql-api';

export class UserProfile implements BaseUserProfile {
  public async getMeProfile(): Promise<PublicUser> {
    const userId = User.instance.data?.id;

    if (!userId) {
      throw new Error('You have to set a user before get the current user profile');
    }

    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const user = await graphQLAPI.fetchUserProfile(userId);

      return user;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid user (${userId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async getUserProfile(userId: string): Promise<PublicUser> {
    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const user = await graphQLAPI.fetchUserProfile(userId);

      return user;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid user (${userId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async updateUserProfile(user: PublicUserInput): Promise<PublicUser> {
    const graphQLAPI = await GraphQLAPI.instance;

    try {
      const updatedUser = await graphQLAPI.updateUser(user);

      return updatedUser;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid user to update.`;
      }

      throw new Error(erroMessage);
    }
  }
}
