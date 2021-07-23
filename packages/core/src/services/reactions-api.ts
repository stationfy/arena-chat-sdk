import { ServerReaction, ChannelReaction } from '../../../types/dist';
import { WebSocketTransport } from '../transports/websocket-transport';

type Instance = {
  [key: string]: ReactionsAPI;
};

export class ReactionsAPI {
  private static instance: Instance = {};

  public static getInstance(channelId: string): ReactionsAPI {
    if (!this.instance[channelId]) {
      this.instance[channelId] = new ReactionsAPI();
    }

    return this.instance[channelId];
  }

  public createReaction(reaction: ServerReaction): void {
    WebSocketTransport.instance.emit('reaction.create', reaction);
  }

  public retrieveUserReactions(): Promise<ServerReaction[]> {
    return new Promise((resolve, reject) => {
      WebSocketTransport.instance.emit(
        'reaction.retrieve',
        {},
        (data: ServerReaction[], err: Record<string, unknown> | null) => {
          if (err) {
            return reject(err);
          }

          resolve(data);
        },
      );
    });
  }

  public watchChannelReactions(callback: (reactions: ChannelReaction[]) => void): void {
    WebSocketTransport.instance.on('reaction.channel', callback);
  }

  public offAllListeners(): void {
    WebSocketTransport.instance.off('reaction.create');
    WebSocketTransport.instance.off('reaction.user');
    WebSocketTransport.instance.off('reaction.channel');
  }
}
