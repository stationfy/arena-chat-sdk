import { ArenaChat } from '../sdk';
import { BaseReaction, MessageReactions, ChannelMessageReactions } from '@arena-im/chat-types';

export class Reaction implements BaseReaction {
  public constructor(public channelId: string, private sdk: ArenaChat) {}

  /**
   * Fetch message reactions
   *
   * @param messageId Message id
   */
  public async fetchReactions(messageId: string): Promise<ChannelMessageReactions> {
    if (this.sdk.site === null) {
      throw new Error('Cannot create a channel without a site.');
    }
    const { GraphQLAPI } = await import('../services/graphql-api');

    const graphQLAPI = new GraphQLAPI(this.sdk.site);

    try {
      const reactions = await graphQLAPI.fetchReactions(this.channelId, messageId);

      return reactions;
    } catch (e) {
      throw new Error(`Cannot fetch users reactions on message: "${messageId}"`);
    }
  }

  /**
   *
   * @param messageReactions reactions from message before modification
   * @param modifiedMessageReactions reactions from message after modification
   *
   * @returns boolean
   */

  static hasBeenModified(messageReactions?: MessageReactions, modifiedMessageReactions?: MessageReactions): boolean {
    if (messageReactions && modifiedMessageReactions) {
      return Object.keys(modifiedMessageReactions).some(
        (key) =>
          Object.prototype.hasOwnProperty.call(messageReactions, key) &&
          messageReactions[key] <= modifiedMessageReactions[key],
      );
    } else if (messageReactions === undefined && modifiedMessageReactions === undefined) {
      return true;
    }

    return false;
  }
}
