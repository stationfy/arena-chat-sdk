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
