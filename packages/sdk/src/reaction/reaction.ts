import { MessageReactions } from '@arena-im/chat-types';

export class Reaction {
  /**
   *
   * @param messageReactions reactions from message before modification
   * @param modifiedMessageReactions reactions from message after modification
   *
   * @returns boolean
   */

  static hasBeenModified(messageReactions?: MessageReactions, modifiedMessageReactions?: MessageReactions): boolean {
    if (messageReactions && modifiedMessageReactions) {
      return Object.keys(modifiedMessageReactions).every(
        (key) =>
          Object.prototype.hasOwnProperty.call(messageReactions, key) &&
          messageReactions[key] <= modifiedMessageReactions[key],
      );
    }

    return false;
  }
}
