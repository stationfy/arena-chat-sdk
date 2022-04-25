import { ChannelReaction, ILiveblogInfo, ServerReaction, PresenceInfo } from '@arena-im/chat-types';
import { BaseReactionsAPI, Credentials, PresenceAPI, ReactionsAPIWS } from '@arena-im/core';
import { BaseLiveBlog } from '../../../types/dist/liveblog';
import { RestAPI } from '../services/rest-api';

export class Liveblog implements BaseLiveBlog {
  private static instance: Promise<Liveblog>;
  private presenceAPI!: PresenceAPI;
  private reactionsAPI!: BaseReactionsAPI;
  private cacheChannelReactions: { [key: string]: ChannelReaction } = {};

  private constructor(private readonly liveblogInfo: ILiveblogInfo) {
    this.initPresence();
  }

  public static getInstance(slug: string): Promise<Liveblog> {
    if (!Liveblog.instance) {
      Liveblog.instance = this.fetchLiveblogInfo(slug).then((liveblogInfo) => {
        return new Liveblog(liveblogInfo);
      });
    }

    return Liveblog.instance;
  }

  private initPresence() {
    this.reactionsAPI = this.getReactionsAPIInstance();
    this.presenceAPI = PresenceAPI.getInstance(this.liveblogInfo.siteId, this.liveblogInfo.key, 'liveblog');
    this.presenceAPI.joinUser();
  }

  private getReactionsAPIInstance(): BaseReactionsAPI {
    return ReactionsAPIWS.getInstance(this.liveblogInfo.key);
  }

  private static async fetchLiveblogInfo(slug: string): Promise<ILiveblogInfo> {
    const restAPI = RestAPI.getAPIInstance();

    const response = await restAPI.loadLiveblog(Credentials.apiKey, slug);

    if (response === null) {
      throw new Error('Cannot fetch liveblog data');
    }

    return response.liveblog;
  }

  public async fetchChannelReactions(): Promise<ChannelReaction[]> {
    try {
      const channelReactions = await this.reactionsAPI.fetchChannelReactions();

      return channelReactions;
    } catch (e) {
      return [];
    }
  }

  public async fetchChannelReactionsMap(): Promise<{
    [key: string]: ChannelReaction;
  }> {
    try {
      const channelReactions = await this.reactionsAPI.fetchChannelReactions();

      this.cacheChannelReactions = this.getChannelReactionsMap(channelReactions);

      return this.cacheChannelReactions;
    } catch (e) {
      return {};
    }
  }

  private getChannelReactionsMap(channelReactions: ChannelReaction[]) {
    const map: { [messageId: string]: ChannelReaction } = {};

    for (const channelReaction of channelReactions) {
      map[channelReaction.itemId] = channelReaction;
    }

    return map;
  }

  /**
   * Watch liveblog channel reactions
   *
   * @param callback callback fn
   */

  public watchEventReactions(callback: (reactions: ChannelReaction[]) => void): void {
    this.reactionsAPI.watchChannelReactions(callback);
  }

  /**
   * Watch liveblog user reactions
   *
   * @param callback callback fn
   */
  public watchUserReactions(callback: (reactions: ServerReaction[]) => void): void {
    this.reactionsAPI.watchUserReactions(callback);
  }

  public watchReactionsErrors(callback: (error: any) => void): void {
    this.reactionsAPI.watchReactionsErrors(callback);
  }

  /**
   * Watch liveblog presence
   *
   * @param callback callback fn
   */

  public watchPresenceInfo(callback: (presenceInfo: PresenceInfo) => void): void {
    this.presenceAPI.watchPresenceInfo(callback);
  }

  public fetchRememberMe(): void {
    console.log(this.liveblogInfo);
  }

  public sendReaction(reaction: ServerReaction): void {
    this.reactionsAPI.createReaction(reaction);
  }
}
