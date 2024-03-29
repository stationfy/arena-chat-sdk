import {
  BasePolls,
  Poll,
  PollFilter,
  ServerReaction,
  LiveChatChannel,
  DocumentChangeType,
  CreatePollInput,
  ExternalPoll,
  ChatRoom,
} from '@arena-im/chat-types';
import { LogApi, User } from '@arena-im/core';
import { RealtimeAPI } from '../services/realtime-api';
import { GraphQLAPI } from '../services/graphql-api';
import { createObserver } from '@arena-im/core';
import { isPolls } from '../utils/is';

export class Polls implements BasePolls {
  private realtimeAPI: RealtimeAPI;
  private cacheCurrentPolls: Poll[] = [];
  private pollModificationListener: (() => void) | null = null;
  private userReactionsPollSubscription: (() => void) | null = null;
  private cacheUserPollsReactions: { [key: string]: ServerReaction } = {};
  private pollModificationCallbacks: { [type: string]: ((poll: Poll) => void)[] } = {};
  private pollErrorsListeners = createObserver<string>();
  private pollErrorsSubscription: (() => void) | null = null;
  private logger: LogApi;

  public constructor(private channel: LiveChatChannel, private chatRoom: ChatRoom) {
    this.logger = new LogApi(Polls.name);
    this.realtimeAPI = RealtimeAPI.getInstance();
  }

  public async createPoll(poll: ExternalPoll): Promise<Poll> {
    if (!User.instance.data?.isModerator) {
      throw new Error('Only moderators can create a poll.');
    }

    const input: CreatePollInput = {
      ...poll,
      channelId: this.channel._id,
      chatRoomId: this.chatRoom._id,
    };

    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.createPoll(input);

      return result;
    } catch (e) {
      throw new Error(`Cannot create this poll question: "${poll.question}".`);
    }
  }

  public async deletePoll(poll: Poll): Promise<Poll> {
    if (!User.instance.data?.isModerator) {
      throw new Error('Only moderators can delete a poll.');
    }

    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.deletePoll(poll._id);

      return result;
    } catch (e) {
      throw new Error(`Cannot delete the poll with this ID: "${poll._id}".`);
    }
  }

  public async loadPolls(filter?: PollFilter, limit?: number): Promise<Poll[]> {
    try {
      const polls = await this.realtimeAPI.fetchAllPolls(this.channel._id, filter, limit);

      if (!isPolls(polls)) {
        throw new Error(`params of Polls incomplete`);
      }

      this.updateCacheCurrentPolls(polls);

      return this.cacheCurrentPolls;
    } catch (e) {
      this.logger.error(`Cannot load polls on "${this.channel._id}" chat channel`, { error: e });
      this.pollErrorsListeners.publish(`Cannot load polls on "${this.channel._id}" chat channel.`);
      throw new Error(`Cannot load polls on "${this.channel._id}" chat channel.`);
    }
  }

  public async pollVote(pollId: string, optionId: number, anonymousId?: string): Promise<boolean> {
    let userId = anonymousId;

    if (User.instance.data) {
      userId = User.instance.data.id;
    }

    if (typeof userId === 'undefined') {
      throw new Error('Cannot vote without anonymoud id or user id.');
    }

    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const result = await graphQLAPI.pollVote({ pollId, userId, optionId });

      return result;
    } catch (e) {
      this.logger.error(`Cannot vote for the "${pollId}" poll question.`, { error: e });
      this.pollErrorsListeners.publish(`Cannot vote for the "${pollId}" poll question: ${e}`);
      throw new Error(`Cannot vote for the "${pollId}" poll question.`);
    }
  }

  public watchPollErrors(callback: (error: any) => void): void {
    if (this.pollErrorsSubscription !== null) {
      this.pollErrorsSubscription();
    }
    this.pollErrorsSubscription = this.pollErrorsListeners.subscribe(callback);
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

        const polls = this.cacheCurrentPolls.concat(newPoll);

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

      this.userReactionsPollSubscription = this.realtimeAPI.listenToUserChatPollsReactions(
        this.channel._id,
        userId,
        (reactions) => {
          reactions.forEach((reaction) => {
            this.cacheUserPollsReactions[reaction.itemId] = reaction;
          });

          this.notifyUserReactionsVerification();
        },
      );
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

    this.pollModificationListener = this.realtimeAPI.listenToPollReceived(this.channel._id, (poll) => {
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
