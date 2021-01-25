import { BaseRemindMe, ExternalUser, Site } from '@arena-im/chat-types';

import { GraphQLAPI } from '../services/graphql-api';

export class RemindMe implements BaseRemindMe {
  private graphQLAPI: GraphQLAPI;

  public constructor(private site: Site, private user: ExternalUser) {
    this.graphQLAPI = new GraphQLAPI(site, user);
  }

  /**
   * Get if user is subscribed to this event
   */
  public async fetchReminderSubscribe(reminderId: string): Promise<boolean> {
    if (this.site === null) {
      throw new Error('Cannot get reminder subscription without a site id');
    }

    if (!this.user) {
      throw new Error('Cannot get reminder subscription without a logged user');
    }

    try {
      const result = await this.graphQLAPI.fetchReminderSubscribe(reminderId);

      return result;
    } catch (e) {
      throw new Error(`Cannot fetch reminder subscription for this user: "${this.user.id}"`);
    }
  }

  /**
   * Subscribe reminder to this event
   */
  public async subscribeRemindMe(reminderId: string): Promise<boolean> {
    if (this.site === null) {
      throw new Error('Cannot get reminder subscription without a site id');
    }

    if (!this.user) {
      throw new Error('Cannot get reminder subscription without a logged user');
    }

    try {
      const result = await this.graphQLAPI.subscribeRemindMe(reminderId);

      return result;
    } catch (e) {
      throw new Error(`Cannot subscribe for this event: "${reminderId}"`);
    }
  }

  /**
   * Unsubscribe reminder to this event
   */
  public async unsubscribeRemindMe(reminderId: string): Promise<boolean> {
    if (this.site === null) {
      throw new Error('Cannot get reminder subscription without a site id');
    }

    if (!this.user) {
      throw new Error('Cannot get reminder subscription without a logged user');
    }

    try {
      const result = await this.graphQLAPI.unsubscribeRemindMe(reminderId);

      return result;
    } catch (e) {
      throw new Error(`Cannot subscribe for this event: "${reminderId}"`);
    }
  }
}
