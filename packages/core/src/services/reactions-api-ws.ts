import { Socket } from 'socket.io-client';
import { createObserver } from '../utils/observer';
import { ServerReaction, ChannelReaction } from '@arena-im/chat-types';
import { WebSocketTransport } from '../transports/websocket-transport';
import { PresenceObservable } from './presence-observable';
import { BaseReactionsAPI } from '../interfaces';
import { isUserReactions } from '../utils/is';

type Instance = {
  [key: string]: ReactionsAPIWS;
};

const EVENT_TYPES = {
  REACTION_CREATE: 'reaction.create',
  REACTION_RETRIEVE: 'reaction.retrieve',
  REACTION_CHANNEL: 'reaction.channel',
  REACTION_USER: 'reaction.user',
  REACTION_CHANNEL_RETRIEVE: 'reaction.channel.retrieve',
};

export class ReactionsAPIWS implements BaseReactionsAPI {
  private static instance: Instance = {};
  private cachedUserReactions: ServerReaction[] | null = null;
  private cachedChannelReactions: ChannelReaction[] | null = null;
  private userReactionsListeners = createObserver<ServerReaction[]>();
  private channelReactionsListeners = createObserver<ChannelReaction[]>();
  private webSocketTransport: Socket;

  private constructor(channelId: string) {
    this.webSocketTransport = WebSocketTransport.getInstance(channelId);

    PresenceObservable.getInstance(channelId).onUserJoinedChanged(this.onPresenceChanged.bind(this));
    PresenceObservable.getInstance(channelId).onUserSettedChanged(this.onPresenceChanged.bind(this));

    this.watchChannelReactionsEvent();
  }

  public static getInstance(channelId: string): ReactionsAPIWS {
    if (!this.instance[channelId]) {
      this.instance[channelId] = new ReactionsAPIWS(channelId);
    }

    return this.instance[channelId];
  }

  private onPresenceChanged() {
    this.fetchUserReactions()
      .then((reactions) => {
        this.userReactionsListeners.publish(reactions);
      })
      .catch(() => {
        console.error('Cannot fetch user reactions');
      });
  }

  public async createReaction(reaction: ServerReaction): Promise<void> {
    this.webSocketTransport.emit(EVENT_TYPES.REACTION_CREATE, reaction);
  }

  public watchUserReactions(callback: (reactions: ServerReaction[]) => void): () => void {
    if (this.cachedUserReactions) {
      callback(this.cachedUserReactions);
    }

    return this.userReactionsListeners.subscribe(callback);
  }

  public async fetchUserReactions(): Promise<ServerReaction[]> {
    try {
      const reactions = await this.retrieveUserReactions();

      if (isUserReactions(reactions)) {
        throw new Error('It is not user reactions');
      }

      this.cachedUserReactions = reactions;

      return reactions;
    } catch (e) {
      throw new Error('Could not retrieve user reactions');
    }
  }

  private retrieveUserReactions(): Promise<ServerReaction[]> {
    return new Promise((resolve, reject) => {
      this.webSocketTransport.emit(
        EVENT_TYPES.REACTION_RETRIEVE,
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

  public fetchChannelReactions(): Promise<ChannelReaction[]> {
    return new Promise((resolve, reject) => {
      this.webSocketTransport.emit(
        EVENT_TYPES.REACTION_CHANNEL_RETRIEVE,
        {},
        (err: Record<string, unknown> | null, data: ChannelReaction[]) => {
          if (err) {
            return reject(err);
          }

          resolve(data);
        },
      );
    });
  }

  public watchChannelReactions(callback: (reactions: ChannelReaction[]) => void): () => void {
    if (this.cachedChannelReactions) {
      callback(this.cachedChannelReactions);
    }

    return this.channelReactionsListeners.subscribe(callback);
  }

  private watchChannelReactionsEvent(): void {
    this.webSocketTransport.on(EVENT_TYPES.REACTION_CHANNEL, (reactions: ChannelReaction[]) => {
      this.cachedChannelReactions = reactions;

      this.channelReactionsListeners.publish(reactions);
    });
  }

  public offAllListeners(): void {
    this.webSocketTransport.off(EVENT_TYPES.REACTION_CREATE);
    this.webSocketTransport.off(EVENT_TYPES.REACTION_USER);
    this.webSocketTransport.off(EVENT_TYPES.REACTION_CHANNEL);
  }
}
