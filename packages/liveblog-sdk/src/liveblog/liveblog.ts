import { ChannelReaction, ILiveblogInfo, MessageReaction, ServerReaction } from '@arena-im/chat-types';
import { Credentials, PresenceAPI, ReactionsAPI } from '@arena-im/core';
import { BaseLiveBlog } from '../../../types/dist/liveblog';
import { RestAPI } from '../services/rest-api';

export class Liveblog implements BaseLiveBlog {
  private static instance: Promise<Liveblog>;
  private presenceAPI!: PresenceAPI;
  private reactionsAPI!: ReactionsAPI;

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
    this.reactionsAPI = ReactionsAPI.getInstance(this.liveblogInfo.key);
    this.presenceAPI = PresenceAPI.getInstance(this.liveblogInfo.siteId, this.liveblogInfo.key, 'liveblog');
    this.presenceAPI.joinUser();
  }

  private static async fetchLiveblogInfo(slug: string): Promise<ILiveblogInfo> {
    const restAPI = RestAPI.getCachedInstance();

    const { liveblog } = await restAPI.loadLiveblog(Credentials.apiKey, slug);

    return liveblog;
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

  public fetchRememberMe(): void {
    console.log(this.liveblogInfo);
  }

  public sendReaction(reaction: ServerReaction): void {
    const reactionsAPI = ReactionsAPI.getInstance(this.liveblogInfo.key);
    reactionsAPI.createReaction(reaction);
  }

  public deleteReaction(reaction: MessageReaction): Promise<boolean> {
    return this.reactionsAPI.deleteReaction(reaction);
  }
}
