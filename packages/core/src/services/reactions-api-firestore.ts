import { ChannelReaction, ServerReaction } from '@arena-im/chat-types';
import { User, UserObservable } from '../auth';
import { BaseReactionsAPI } from '../interfaces/base-reactions-api';
import { RealtimeAPI } from './realtime-api';
import { RestAPI } from './rest-api';
import { createObserver } from '../utils/observer';
import { GraphQLAPI } from './graphql-api';

type Instance = {
  [key: string]: ReactionsAPIFirestore;
};

export class ReactionsAPIFirestore implements BaseReactionsAPI {
  private static instance: Instance = {};
  private userReactionsListeners = createObserver<ServerReaction[]>();

  private constructor(private channelId: string) {
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
  }

  public async fetchUserReactions(): Promise<ServerReaction[]> {
    const userId = User.instance.data?.id ?? User.instance.anonymousId;

    const realtimeAPI = RealtimeAPI.getInstance();

    return realtimeAPI.fetchUserReactions(this.channelId, userId);
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

  public offAllListeners(): void {
    // There is no listeners in this implementation
  }
}
