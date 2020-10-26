import { BasePolls, Poll, PollFilter, ServerReaction, LiveChatChannel } from '@arena-im/chat-types';
import { ArenaChat } from '../sdk';
import { RealtimeAPI } from '../services/realtime-api';
import { GraphQLAPI } from '../services/graphql-api';
import { DocumentChangeType } from '@arena-im/chat-types/dist/firestore';

export class Polls implements BasePolls {
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentPolls: Poll[] = [];
  private graphQLAPI: GraphQLAPI;
  private pollModificationListener: (() => void) | null = null;
  private userReactionsPollSubscription: (() => void) | null = null;
  private cacheUserPollsReactions: { [key: string]: ServerReaction } = {};
  private pollModificationCallbacks: { [type: string]: ((poll: Poll) => void)[] } = {};

  public constructor(private channel: LiveChatChannel, private sdk: ArenaChat) {
    this.realtimeAPI = new RealtimeAPI(channel._id);
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    this.graphQLAPI = new GraphQLAPI(this.sdk.site!, this.sdk.user || undefined);
  }

  public async loadPolls(filter?: PollFilter, limit?: number): Promise<Poll[]> {
    try {
      const polls = await this.realtimeAPI.fetchAllPolls(filter, limit);

      this.updateCacheCurrentPolls(polls);

      return this.cacheCurrentPolls;
    } catch (e) {
      throw new Error(`Cannot load polls on "${this.channel._id}" chat channel.`);
    }
  }

  public async pollVote(pollId: string, optionId: number, anonymousId?: string): Promise<boolean> {
    let userId = anonymousId;

    if (this.sdk.user) {
      userId = this.sdk.user.id;
    }

    if (typeof userId === 'undefined') {
      throw new Error('Cannot vote without anonymoud id or user id.');
    }

    try {
      const result = await this.graphQLAPI.pollVote({ pollId, userId, optionId });

      return result;
    } catch (e) {
      throw new Error(`Cannot vote for the "${pollId}" poll question.`);
    }
  }

  /**
   * Remove poll received listener
   *
   */
  public offPollReceived(): void {
    this.pollModificationCallbacks[DocumentChangeType.ADDED] = [];
  }

  /**
   * Watch new polls on channel
   *
   * @param callback
   */
  public onPollReceived(callback: (poll: Poll) => void): void {
    try {
      this.registerPollModificationCallback((newPoll) => {
        if (this.cacheCurrentPolls.some((poll) => newPoll._id === poll._id)) {
          return;
        }

        const polls = [...this.cacheCurrentPolls, newPoll];

        this.updateCacheCurrentPolls(polls);

        callback(newPoll);
      }, DocumentChangeType.ADDED);
    } catch (e) {
      throw new Error(`Cannot watch new polls on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Remove message modified listener
   *
   */
  public offPollModified(): void {
    this.pollModificationCallbacks[DocumentChangeType.MODIFIED] = [];
  }

  /**
   * Watch messages modified
   *
   * @param callback
   */
  public onPollModified(callback: (poll: Poll) => void): void {
    try {
      this.registerPollModificationCallback((modifiedPoll) => {
        const polls = this.cacheCurrentPolls.map((poll) => {
          if (poll._id === modifiedPoll._id) {
            modifiedPoll.currentUserVote = poll.currentUserVote;
            return modifiedPoll;
          }

          return poll;
        });

        this.updateCacheCurrentPolls(polls);

        callback(modifiedPoll);
      }, DocumentChangeType.MODIFIED);
    } catch (e) {
      throw new Error(`Cannot watch polls modified on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Remove message deleted listener
   *
   */
  public offPollDeleted(): void {
    this.pollModificationCallbacks[DocumentChangeType.REMOVED] = [];
  }

  /**
   * Watch messages deleted
   *
   * @param callback
   */
  public onPollDeleted(callback: (poll: Poll) => void): void {
    try {
      this.registerPollModificationCallback((poll) => {
        const polls = this.cacheCurrentPolls.filter((item) => item._id !== poll._id);

        this.updateCacheCurrentPolls(polls);

        callback(poll);
      }, DocumentChangeType.REMOVED);
    } catch (e) {
      throw new Error(`Cannot watch deleted polls on "${this.channel._id}" channel.`);
    }
  }

  /**
   * Remove all polls' listeners
   *
   */
  public offAllListeners(): void {
    this.pollModificationCallbacks[DocumentChangeType.ADDED] = [];
    this.pollModificationCallbacks[DocumentChangeType.MODIFIED] = [];
    this.pollModificationCallbacks[DocumentChangeType.REMOVED] = [];
  }

  /**
   * Watch user polls reactions
   *
   * @param user external user
   */
  public watchUserPollsReactions(userId: string): void {
    if (this.userReactionsPollSubscription !== null) {
      this.userReactionsPollSubscription();
    }

    try {
      this.cacheUserPollsReactions = {};

      this.userReactionsPollSubscription = this.realtimeAPI.listenToUserChatPollsReactions(userId, (reactions) => {
        reactions.forEach((reaction) => {
          this.cacheUserPollsReactions[reaction.itemId] = reaction;
        });

        this.notifyUserReactionsVerification();
      });
    } catch (e) {
      throw new Error('Cannot listen to user reactions');
    }
  }

  /**
   * Notify User Reaction Verication
   */
  private notifyUserReactionsVerification() {
    this.cacheCurrentPolls.forEach((poll) => {
      if (typeof poll._id === 'undefined') {
        return;
      }

      const reaction = this.cacheUserPollsReactions[poll._id];
      if (reaction && typeof poll.currentUserVote === 'undefined') {
        poll.currentUserVote = parseInt(reaction.reaction);

        const modifiedCallbacks = this.pollModificationCallbacks[DocumentChangeType.MODIFIED];
        if (typeof modifiedCallbacks !== 'undefined') {
          modifiedCallbacks.forEach((callback) => callback({ ...poll }));
        }
      }
    });
  }

  /**
   * Register poll modification callback
   *
   */
  private registerPollModificationCallback(callback: (poll: Poll) => void, type: DocumentChangeType) {
    if (!this.pollModificationCallbacks[type]) {
      this.pollModificationCallbacks[type] = [];
    }

    this.pollModificationCallbacks[type].push(callback);

    this.listenToAllTypePollModification();
  }

  /**
   * Listen to all type poll modification
   *
   */
  private listenToAllTypePollModification() {
    if (this.pollModificationListener !== null) {
      return;
    }

    this.pollModificationListener = this.realtimeAPI.listenToPollReceived((poll) => {
      if (poll.changeType === undefined || !this.pollModificationCallbacks[poll.changeType]) {
        return;
      }

      this.pollModificationCallbacks[poll.changeType].forEach((callback) => callback(poll));
    });
  }

  /**
   * Update the cache of current polls
   *
   * @param polls
   */
  private updateCacheCurrentPolls(polls: Poll[]): void {
    polls = polls.map((poll) => {
      const reaction = this.cacheUserPollsReactions[poll._id];

      if (typeof reaction !== 'undefined') {
        poll.currentUserVote = parseInt(reaction.reaction);
      }

      return poll;
    });

    this.cacheCurrentPolls = polls;
  }
}
