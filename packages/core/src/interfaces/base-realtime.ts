import { ServerReaction } from '@arena-im/chat-types';

/** Realtime used to listen to realtime events */
export interface BaseRealtime {
  /**
   * Listen to user reactions from Firebase
   *
   * @deprecated
   * @param user external user
   */
  fetchUserReactions(channelId: string, userId: string): Promise<ServerReaction[]>;
}
