import { ServerReaction } from '@arena-im/chat-types';
import { FirestoreAPI } from '../transports';
import { BaseRealtime } from '../interfaces';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtime {
  private static instance: RealtimeAPI;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(): RealtimeAPI {
    if (!RealtimeAPI.instance) {
      RealtimeAPI.instance = new RealtimeAPI();
    }

    return RealtimeAPI.instance;
  }

  /**
   * @inheritdoc
   */
  public async fetchUserReactions(channelId: string, userId: string): Promise<ServerReaction[]> {
    const userReactions: ServerReaction[] = (await FirestoreAPI.fetchCollectionItems({
      path: 'reactions',
      where: [
        {
          fieldPath: 'userId',
          opStr: '==',
          value: userId,
        },
        {
          fieldPath: 'openChannelId',
          opStr: '==',
          value: channelId,
        },
      ],
    })) as ServerReaction[];

    return userReactions;
  }
}
