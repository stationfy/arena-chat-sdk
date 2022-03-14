import { EmbedSettings, ILiveblogInfo, Site } from '@arena-im/chat-types';
import { fetchCachedAPIData } from '@arena-im/core';

export class RestAPI {
  private static apiInstance: RestAPI;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /**
   *
   * @returns api v2 with authentication
   */
  public static getAPIInstance(): RestAPI {
    if (!RestAPI.apiInstance) {
      RestAPI.apiInstance = new RestAPI();
    }

    return RestAPI.apiInstance;
  }

  /**
   * @inheritdoc
   */
  public loadLiveblog(
    siteSlug: string,
    liveblogSlug: string,
  ): PromiseLike<{ liveblog: ILiveblogInfo; site: Site; settings: EmbedSettings } | null> {
    return fetchCachedAPIData<{ eventInfo: ILiveblogInfo; publisher: Site; settings: EmbedSettings }>(
      `/liveblog/${siteSlug}/${liveblogSlug}`,
    ).then((cached) => {
      if (cached === null) {
        return null;
      }

      return {
        liveblog: cached.eventInfo,
        site: cached.publisher,
        settings: cached.settings,
      };
    });
  }
}
