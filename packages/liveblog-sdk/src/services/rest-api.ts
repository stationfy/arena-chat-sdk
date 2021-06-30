import { EmbedSettings, ExternalUser, ILiveblogInfo, Site } from '@arena-im/chat-types';
import {
  FetchTransport,
  XHRTransport,
  BaseTransport,
  BaseRestOptions,
  supportsFetch,
  UserObservable,
} from '@arena-im/core';
import { API_V2_URL, CACHED_API, DEFAULT_AUTH_TOKEN } from '../config';

export class RestAPI {
  private static apiInstance: RestAPI;
  private static cachedInstance: RestAPI;
  private static apiNoauthInstance: RestAPI;

  private baseURL = API_V2_URL;
  private transport!: BaseTransport;

  private constructor(options?: BaseRestOptions) {
    const { url, authToken } = options || {};

    if (url) {
      this.baseURL = url;
    }

    this.setTransport(authToken);
    UserObservable.instance.onUserChanged(this.handleUserChange.bind(this));
  }

  private handleUserChange(user: ExternalUser | null) {
    const token = user?.token;

    this.setAPIToken(token);
  }

  private setTransport(authToken?: string) {
    if (supportsFetch()) {
      this.transport = new FetchTransport(this.baseURL, authToken);
    } else {
      this.transport = new XHRTransport(this.baseURL, authToken);
    }
  }

  /**
   *
   * @returns api v2 with authentication
   */
  public static getAPIInstance(): RestAPI {
    if (!RestAPI.apiInstance) {
      RestAPI.apiInstance = new RestAPI({ url: API_V2_URL, authToken: DEFAULT_AUTH_TOKEN });
    }

    return RestAPI.apiInstance;
  }

  private setAPIToken(token: string = DEFAULT_AUTH_TOKEN) {
    this.setTransport(token);
  }

  /**
   *
   * @returns cached api
   */
  public static getCachedInstance(): RestAPI {
    if (!RestAPI.cachedInstance) {
      RestAPI.cachedInstance = new RestAPI({ url: CACHED_API });
    }

    return RestAPI.cachedInstance;
  }

  /**
   *
   * @returns api v2 w/o authentication
   */
  public static getAPINoauthInstance(): RestAPI {
    if (!RestAPI.apiNoauthInstance) {
      RestAPI.apiNoauthInstance = new RestAPI({ url: API_V2_URL });
    }

    return RestAPI.apiNoauthInstance;
  }

  /**
   * @inheritdoc
   */
  public loadLiveblog(
    siteSlug: string,
    liveblogSlug: string,
  ): PromiseLike<{ liveblog: ILiveblogInfo; site: Site; settings: EmbedSettings }> {
    return this.transport
      .get<{ eventInfo: ILiveblogInfo; publisher: Site; settings: EmbedSettings }>(
        `/liveblog/${siteSlug}/${liveblogSlug}`,
      )
      .then((cached) => {
        return {
          liveblog: cached.eventInfo,
          site: cached.publisher,
          settings: cached.settings,
        };
      });
  }
}
