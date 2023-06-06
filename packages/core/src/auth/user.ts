import { ExternalUser } from '@arena-im/chat-types';
import { RestAPI } from '../services/rest-api';
import { Credentials } from './credentials';
import { UserObservable } from './user-observable';
import { StorageAPI } from '../services/storage-api';
import { ARENA_URL } from '../config';
import { generateUUIDV4, getGlobalObject } from '../utils/misc';
import { Logger } from '../services/logger';

const userCountryCacheKey = 'arenaUserCountry';
const anonymousIdCacheKey = 'anonymousUserId';

const ARENA_HUB_ANONYMOUS_ID = 'arena_hub_anonymous_id';
const ASK_ARENA_HUB_ANONYMOUS_ID = 'ask_arena_hub_anonymous_id';

export class User {
  private static userInstance: User;
  public data: ExternalUser | null = null;
  private anonymousIdValue = this.generateUserId();
  private localStorage: StorageAPI;
  private global = getGlobalObject<Window>();

  private constructor() {
    this.localStorage = new StorageAPI();
    this.handleAnonymousId();
    this.generateTrackIframe();
  }

  private generateUserId(): string {
    return generateUUIDV4();
  }

  public static get instance(): User {
    if (!User.userInstance) {
      User.userInstance = new User();
    }

    return User.userInstance;
  }

  /**
   * Set a new user
   *
   * @param user external user
   */
  public async setNewUser(user: ExternalUser): Promise<ExternalUser> {
    const [givenName, ...familyName] = user.name.split(' ');

    const restAPI = RestAPI.getAPIInstance();

    const result = await restAPI.getArenaUser({
      provider: Credentials.apiKey,
      username: user.id,
      profile: {
        urlName: `${+new Date()}`,
        email: user.email,
        username: user.id,
        displayName: user.name,
        name: {
          familyName: familyName.join(' '),
          givenName,
        },
        profileImage: user.image,
        id: user.id,
      },
      metadata: user.metaData,
    });

    this.data = {
      ...user,
      id: result.id,
      token: result.token,
      isModerator: result.isModerator,
      isBanned: result.isBanned,
    };

    UserObservable.instance.updateUser(this.data);

    return this.data;
  }

  public setInternalUser(user: ExternalUser): ExternalUser | null {
    UserObservable.instance.updateUser(user);

    this.data = user;

    return this.data;
  }

  /**
   * Unset user
   *
   */
  public unsetUser(): void {
    this.data = null;

    UserObservable.instance.updateUser(null);
  }

  private handleAnonymousId() {
    const anonymousIdFromCache = this.localStorage.getItem(anonymousIdCacheKey);

    if (anonymousIdFromCache) {
      this.anonymousIdValue = anonymousIdFromCache;
    }
  }

  private get countryFromCache() {
    return this.localStorage.getItem(userCountryCacheKey);
  }

  private set cacheCountry(country: string) {
    this.localStorage.setItem(userCountryCacheKey, country);
  }

  public async loadCountry(): Promise<string> {
    if (this.countryFromCache) {
      return this.countryFromCache;
    }

    const restAPI = RestAPI.getAPINoauthInstance();
    const country = await restAPI.loadViewerCountry();
    this.cacheCountry = country;

    return country;
  }

  public get anonymousId(): string {
    return this.anonymousIdValue;
  }

  public set anonymousId(value: string) {
    this.anonymousIdValue = value;
  }

  private generateTrackIframe() {
    if (typeof window === 'undefined') {
      return;
    }

    const url = ARENA_URL;

    this.global.addEventListener(
      'message',
      (event) => {
        if (event.origin === url && event.data.type === ARENA_HUB_ANONYMOUS_ID) {
          this.anonymousId = event.data.value;
        }
      },
      false,
    );

    this.askHubFrameForAnonymousId();
  }

  private askHubFrameForAnonymousId() {
    try {
      // check whether track frame already exists
      const arenaHubFrame = this.global.document.querySelector('[name="arena-hub-frame"]') as HTMLIFrameElement;

      if (arenaHubFrame) {
        arenaHubFrame.contentWindow?.postMessage({ type: ASK_ARENA_HUB_ANONYMOUS_ID }, ARENA_URL);
      } else {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
          this.createArenaHubIframe();
        }

        this.global.addEventListener('DOMContentLoaded', () => {
          this.createArenaHubIframe();
        });
      }
    } catch (error) {
      Logger.instance.log('error', 'ArenaWebSDK - Could not get AnonymousId', { error: error });
    }
  }

  private createArenaHubIframe() {
    const url = ARENA_URL;

    const iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    iframe.src = url + '/arenahubframe';
    iframe.name = 'arena-hub-frame';

    document.body.appendChild(iframe);
  }
}
