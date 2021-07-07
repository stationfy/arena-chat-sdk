import { ProviderUser, ExternalUser, SSOExchangeResult, Site } from '@arena-im/chat-types';
import { FetchTransport, XHRTransport } from '../transports';
import { BaseTransport, BaseRestOptions } from '../interfaces';
import { supportsFetch } from '../utils/supports';
import { API_V2_URL, CACHED_API, DEFAULT_AUTH_TOKEN } from '../config';
import { UserObservable } from '../auth/user-observable';

/** Base rest class implementation */
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
  public getArenaUser(user: ProviderUser): PromiseLike<ExternalUser> {
    return this.transport.post<SSOExchangeResult, ProviderUser>('/profile/ssoexchange', user).then((data) => {
      const resultUser = data.data.user;
      const resultToken = data.data.token;

      const externalUser: ExternalUser = {
        id: resultUser._id,
        name: resultUser.name,
        image: resultUser.thumbnails.raw,
        email: resultUser.profile.email,
        token: resultToken,
        isModerator: resultUser.isModerator,
        isBanned: resultUser.isBanned,
      };

      return externalUser;
    });
  }

  /**
   *
   * @inheritdoc
   */
  public loadSite(siteSlug: string): PromiseLike<Site> {
    return this.transport.get<Site>(`/sites/${siteSlug}`).then((site) => {
      return site;
    });
  }
}