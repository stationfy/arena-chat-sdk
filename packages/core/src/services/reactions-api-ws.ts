import { Socket } from 'socket.io-client';
import { createObserver } from '../utils/observer';
import { ServerReaction, ChannelReaction } from '@arena-im/chat-types';
import { WebSocketTransport } from '../transports/websocket-transport';
import { PresenceObservable } from './presence-observable';
import { BaseReactionsAPI } from '../interfaces';
import { isChannelReactions, isUserReactions } from '../utils/is';
import { LogApi } from '.';
import { promiseTimeout } from '../utils/misc';

type Instance = {
  [key: string]: ReactionsAPIWS;
};

const EVENT_TYPES = {
  REACTION_CREATE: 'reaction.create',
  REACTION_RETRIEVE: 'reaction.retrieve',
  REACTION_CHANNEL: 'reaction.channel',
  REACTION_USER: 'reaction.user',
  REACTION_CHANNEL_RETRIEVE: 'reaction.channel.retrieve',
  REACTION_REMOVE: 'reaction.remove',
};
const WS_PROMISE_TIMEOUT = 3000;
export class ReactionsAPIWS implements BaseReactionsAPI {
  private static instance: Instance = {};
  private cachedUserReactions: ServerReaction[] | null = null;
  private cachedChannelReactions: ChannelReaction[] | null = null;
  private userReactionsListeners = createObserver<ServerReaction[]>();
  private channelReactionsListeners = createObserver<ChannelReaction[]>();
  private reactionsErrorsListeners = createObserver<string>();
  private webSocketTransport: Socket;
  private logger: LogApi;

  private constructor(channelId: string) {
    this.logger = new LogApi(ReactionsAPIWS.name);

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
    return promiseTimeout(
      new Promise((resolve, reject) => {
        this.webSocketTransport.emit(EVENT_TYPES.REACTION_CREATE, reaction, (error: Record<string, unknown> | null) => {
          if (error) {
            this.logger.error(`Error to create reaction.`, { error });
            this.reactionsErrorsListeners.publish(`Error to create reaction.`);
            return reject(error);
          }

          resolve({});
        });
      }),
      WS_PROMISE_TIMEOUT,
    );
  }

  public watchUserReactions(callback: (reactions: ServerReaction[]) => void): () => void {
    if (this.cachedUserReactions) {
      callback(this.cachedUserReactions);
    }

    return this.userReactionsListeners.subscribe(callback);
  }

  public watchReactionsErrors(callback: (error: any) => void): () => void {
    return this.reactionsErrorsListeners.subscribe(callback);
  }

  public async fetchUserReactions(): Promise<ServerReaction[]> {
    try {
      const reactions = await this.retrieveUserReactions();

      this.cachedUserReactions = reactions;

      return reactions;
    } catch (error) {
      this.logger.error(`Could not retrieve user reactions.`, { error });
      throw new Error('Could not retrieve user reactions');
    }
  }

  private retrieveUserReactions(): Promise<ServerReaction[]> {
    return promiseTimeout(
      new Promise((resolve, reject) => {
        this.webSocketTransport.emit(
          EVENT_TYPES.REACTION_RETRIEVE,
          {},
          (error: Record<string, unknown> | null, data: ServerReaction[]) => {
            if (error) {
              this.logger.error('Could not retrieve user reactions.', { error });
              this.reactionsErrorsListeners.publish('Could not retrieve user reactions.');
              return reject(error);
            }

            if (!isUserReactions(data)) {
              this.reactionsErrorsListeners.publish('params of ServerReaction incomplete');
              return reject('params of ServerReaction incomplete');
            }

            resolve(data);
          },
        );
      }),
      WS_PROMISE_TIMEOUT,
    );
  }

  public fetchChannelReactions(): Promise<ChannelReaction[]> {
    return promiseTimeout(
      new Promise((resolve, reject) => {
        this.webSocketTransport.emit(
          EVENT_TYPES.REACTION_CHANNEL_RETRIEVE,
          {},
          (error: Record<string, unknown> | null, reactions: ChannelReaction[]) => {
            if (error) {
              this.logger.error(`Could not fetch channel reactions.`, { error });
              this.reactionsErrorsListeners.publish(`Could not fetch channel reactions.`);
              return reject(error);
            }

            if (!isChannelReactions(reactions)) {
              this.reactionsErrorsListeners.publish('params of ChannelReaction incomplete');
              return reject('params of ChannelReaction incomplete');
            }

            this.cachedChannelReactions = reactions;

            resolve(reactions);
          },
        );
      }),
      WS_PROMISE_TIMEOUT,
    );
  }

  public watchChannelReactions(callback: (reactions: ChannelReaction[]) => void): () => void {
    if (this.cachedChannelReactions) {
      callback(this.cachedChannelReactions);
    }

    return this.channelReactionsListeners.subscribe(callback);
  }

  private watchChannelReactionsEvent(): void {
    this.webSocketTransport.on(EVENT_TYPES.REACTION_CHANNEL, (reactions: ChannelReaction[]) => {
      if (!isChannelReactions(reactions)) {
        this.logger.error('params of ChannelReaction incomplete');
        this.reactionsErrorsListeners.publish('params of ChannelReaction incomplete');
      } else {
        this.cachedChannelReactions = this.updateCachedChannelReactions(reactions);
        this.channelReactionsListeners.publish(this.cachedChannelReactions);
      }
    });
  }

  private updateCachedChannelReactions(reactions: ChannelReaction[]): ChannelReaction[] {
    if (this.cachedChannelReactions === null) {
      return reactions;
    }

    const cachedReactionsObj = this.cachedChannelReactions.reduce<{ [itemId: string]: ChannelReaction }>(
      (reactionsObj, reaction) => {
        reactionsObj[reaction.itemId] = reaction;

        return reactionsObj;
      },
      {},
    );

    for (const newReaction of reactions) {
      cachedReactionsObj[newReaction.itemId] = { ...newReaction };
    }

    const newCachedReactions: ChannelReaction[] = [];

    for (const itemId in cachedReactionsObj) {
      newCachedReactions.push(cachedReactionsObj[itemId]);
    }

    return newCachedReactions;
  }

  public offAllListeners(): void {
    this.webSocketTransport.off(EVENT_TYPES.REACTION_CREATE);
    this.webSocketTransport.off(EVENT_TYPES.REACTION_USER);
    this.webSocketTransport.off(EVENT_TYPES.REACTION_CHANNEL);
  }

  public removeReaction(reaction: ServerReaction): Promise<ChannelReaction[]> {
    return promiseTimeout(
      new Promise((resolve, reject) => {
        this.webSocketTransport.emit(
          EVENT_TYPES.REACTION_REMOVE,
          reaction,
          (error: Record<string, unknown> | null, nextReactions: ChannelReaction[]) => {
            if (error) {
              this.logger.error(`Could not remove the reaction from ${reaction.itemId}`, { error });
              return reject(error);
            }

            if (!isChannelReactions(nextReactions)) {
              return reject('Reactions received are incompleted');
            }

            resolve(nextReactions);
          },
        );
      }),
      WS_PROMISE_TIMEOUT,
    );
  }
}
