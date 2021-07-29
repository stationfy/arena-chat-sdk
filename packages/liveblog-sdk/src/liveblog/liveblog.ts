import { ILiveblogInfo } from '@arena-im/chat-types';
import { Credentials, PresenceAPI } from '@arena-im/core';
import { RestAPI } from '../services/rest-api';

export class Liveblog {
  private static instance: Promise<Liveblog>;
  private presenceAPI!: PresenceAPI;

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
    this.presenceAPI = PresenceAPI.getInstance(this.liveblogInfo.siteId, this.liveblogInfo.key, 'liveblog');
    this.presenceAPI.joinUser();
  }

  private static async fetchLiveblogInfo(slug: string): Promise<ILiveblogInfo> {
    const restAPI = RestAPI.getCachedInstance();

    const { liveblog } = await restAPI.loadLiveblog(Credentials.apiKey, slug);

    return liveblog;
  }

  public fetchRememberMe(): void {
    console.log(this.liveblogInfo);
  }
}
