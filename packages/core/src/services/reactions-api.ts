import { Socket } from 'socket.io-client';
import { createObserver } from '../utils/observer';
import { ServerReaction, ChannelReaction } from '../../../types/dist';
import { WebSocketTransport } from '../transports/websocket-transport';
import { PresenceObservable } from './presence-observable';

type Instance = {
  [key: string]: ReactionsAPI;
};

export class ReactionsAPI {
  private static instance: Instance = {};
  private cachedUserReactions: ServerReaction[] | null = null;
  private cachedChannelReactions: ChannelReaction[] | null = null;
  private userReactionsListeners = createObserver<ServerReaction[]>();
  private channelReactionsListeners = createObserver<ChannelReaction[]>();
  private webSocketTransport: Socket;

  constructor(channelId: string) {
    this.webSocketTransport = WebSocketTransport.getInstance(channelId);

    PresenceObservable.getInstance(channelId).onUserJoinedChanged(this.onPresenceChanged.bind(this));
    PresenceObservable.getInstance(channelId).onUserSettedChanged(this.onPresenceChanged.bind(this));

    this.watchChannelReactionsEvent();
  }

  public static getInstance(channelId: string): ReactionsAPI {
    if (!this.instance[channelId]) {
      this.instance[channelId] = new ReactionsAPI(channelId);
    }

    return this.instance[channelId];
  }

  private onPresenceChanged() {
    this.fetchUserReactions().then((reactions) => {
      this.userReactionsListeners.publish(reactions);
    });
  }

  public createReaction(reaction: ServerReaction): void {
    this.webSocketTransport.emit('reaction.create', reaction);
  }

  public watchUserReactions(callback: (reactions: ServerReaction[]) => void): void {
    if (this.cachedUserReactions) {
      callback(this.cachedUserReactions);
    }

    this.userReactionsListeners.subscribe(callback);
  }

  public async fetchUserReactions(): Promise<ServerReaction[]> {
    try {
      const reactions = await this.retrieveUserReactions();
      this.cachedUserReactions = reactions;

      return reactions;
    } catch (e) {
      throw new Error('Could not retrieve user reactions');
    }
  }

  public retrieveUserReactions(): Promise<ServerReaction[]> {
    return new Promise((resolve, reject) => {
      this.webSocketTransport.emit(
        'reaction.retrieve',
        {},
        (err: Record<string, unknown> | null, data: ServerReaction[]) => {
          if (err) {
            return reject(err);
          }

          resolve(data);
        },
      );
    });
  }

  public watchChannelReactions(callback: (reactions: ChannelReaction[]) => void): void {
    if (this.cachedChannelReactions) {
      callback(this.cachedChannelReactions);
    }

    this.channelReactionsListeners.subscribe(callback);
  }

  private watchChannelReactionsEvent(): void {
    this.webSocketTransport.on('reaction.channel', (reactions: ChannelReaction[]) => {
      this.cachedChannelReactions = reactions;

      this.channelReactionsListeners.publish(reactions);
    });
  }

  public offAllListeners(): void {
    this.webSocketTransport.off('reaction.create');
    this.webSocketTransport.off('reaction.user');
    this.webSocketTransport.off('reaction.channel');
  }
}
