import { ChannelReaction, ServerReaction } from '@arena-im/chat-types';
import { User, UserObservable } from '../auth';
import { BaseReactionsAPI } from '../interfaces/base-reactions-api';
import { RealtimeAPI } from './realtime-api';
import { RestAPI } from './rest-api';
import { createObserver } from '../utils/observer';
import { GraphQLAPI } from './graphql-api';
import { isUserReactions } from '../utils/is';
import { LogApi } from '.';

type Instance = {
  [key: string]: ReactionsAPIFirestore;
};

export class ReactionsAPIFirestore implements BaseReactionsAPI {
  private static instance: Instance = {};
  private userReactionsListeners = createObserver<ServerReaction[]>();
  private reactionsErrorsListeners = createObserver<string>();
  private logger: LogApi;

  private constructor(private channelId: string) {
    this.logger = new LogApi(ReactionsAPIFirestore.name);
    UserObservable.instance.onUserChanged(() => this.watchUserChanged());
  }

  public static getInstance(channelId: string): ReactionsAPIFirestore {
    if (!this.instance[channelId]) {
      this.instance[channelId] = new ReactionsAPIFirestore(channelId);
    }

    return this.instance[channelId];
  }

  /**
   * Watch user changed
   *
   * @param {ExternalUser} user external user
   */
  private watchUserChanged() {
    this.fetchUserReactions().then((reactions) => {
      this.userReactionsListeners.publish(reactions);
    });
  }

  /**
   * Create a reaction on Firebase
   * @deprecated
   */
  public async createReaction(reaction: ServerReaction): Promise<void> {
    try {
      if (reaction.itemType === 'poll') {
        const graphQLAPI = await GraphQLAPI.instance;
        await graphQLAPI.pollVote({
          pollId: reaction.itemId,
          userId: reaction.userId,
          optionId: parseInt(reaction.reaction),
        });
      } else {
        const restAPI = RestAPI.getAPIInstance();
        await restAPI.sendReaction(reaction);
      }
    } catch (error) {
      this.logger.error(`Error to create reaction.`, { error });
      this.reactionsErrorsListeners.publish(`Error to create reaction.`);
      throw new Error(`Error to create reaction.`);
    }
  }

  public async fetchUserReactions(): Promise<ServerReaction[]> {
    const userId = User.instance.data?.id ?? User.instance.anonymousId;

    const realtimeAPI = RealtimeAPI.getInstance();

    const userReactions = await realtimeAPI.fetchUserReactions(this.channelId, userId);

    if (!isUserReactions(userReactions)) {
      this.reactionsErrorsListeners.publish('params of ServerReaction incomplete');
      this.logger.error('params of ServerReaction incomplete');
      throw new Error('params of ServerReaction incomplete');
    }

    return userReactions;
  }

  public async fetchChannelReactions(): Promise<ChannelReaction[]> {
    // It's already in the messages and posts
    return [];
  }

  public watchUserReactions(callback: (reactions: ServerReaction[]) => void): () => void {
    return this.userReactionsListeners.subscribe(callback);
  }

  public watchChannelReactions(): () => void {
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => {};
  }

  public watchReactionsErrors(callback: (error: any) => void): () => void {
    return this.reactionsErrorsListeners.subscribe(callback);
  }

  public offAllListeners(): void {
    // There is no listeners in this implementation
  }
}
