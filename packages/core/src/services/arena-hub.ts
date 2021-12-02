import { ChatRoom, TrackPayload, EventMap } from '@arena-im/chat-types';
import { OrganizationSite } from '../organization';
import { User } from '../auth';
import { getGlobalObject } from '../utils/misc';
import { RestAPI } from './rest-api';

type OptionalSpread<T = undefined> = T extends undefined ? [] : [T];

export class ArenaHub {
  private static instance: ArenaHub;
  private anonymousId: string;
  private global = getGlobalObject<Window>();

  private constructor(private chatRoom: ChatRoom) {
    this.anonymousId = this.getMessageId();
  }

  public static getInstance(chatRoom: ChatRoom): ArenaHub {
    if (!this.instance) {
      this.instance = new ArenaHub(chatRoom);
    }

    return this.instance;
  }

  public async track<T extends keyof EventMap>(
    event: T,
    ...options: OptionalSpread<EventMap[T]>
  ): Promise<{ success: boolean }> {
    const trackObj = await this.getTrackPayload('track');

    if (options.length > 0) {
      trackObj.properties = { ...trackObj.properties, ...options[0] };
    }

    trackObj.event = event;

    return this.sendRequest(trackObj);
  }

  public async trackPage(): Promise<{ success: boolean }> {
    const trackObj = await this.getTrackPayload('page');

    return this.sendRequest(trackObj);
  }

  private async getTrackPayload(type: TrackPayload['type']): Promise<TrackPayload> {
    const site = await OrganizationSite.instance.getSite();

    const user = User.instance.data;

    const trackObj: TrackPayload = {
      userId: user?.id || null,
      anonymousId: this.anonymousId,
      context: this.getContext(),
      messageId: this.getMessageId(),
      timestamp: this.getTimestamp(),
      writeKey: site._id,
      sentAt: this.getTimestamp(),
      properties: this.getPageInfo(),
      arenaUserId: user?.id || null,
      type,
    };

    return trackObj;
  }

  private async sendRequest(trackObj: TrackPayload): Promise<{ success: boolean }> {
    const restAPI = RestAPI.getAPINoauthInstance();
    return await restAPI.collect(trackObj);
  }

  private getPageInfo(): TrackPayload['properties'] {
    return {
      path: this.global.location.pathname,
      referrer: this.global.document.referrer,
      search: this.global.location.search,
      title: this.global.document.title,
      url: this.global.location.href,
    };
  }

  private getTimestamp(): string {
    const now = new Date();

    return now.toISOString();
  }

  private getMessageId(): string {
    try {
      return this.uuidv4();
    } catch (e) {
      console.info("The browser doesn't support web cryptography");
    }

    let dt = new Date().getTime();
    const mask = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';
    const uuid = mask.replace(/[xy]/g, function (c) {
      const r = (dt + Math.random() * 16) % 16 | 0;
      dt = Math.floor(dt / 16);
      return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
  }

  private uuidv4(): string {
    // @ts-ignore
    return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, (c) => {
      return (c ^ (this.global.crypto.getRandomValues(new Uint8Array(1))[0] & (15 >> (c / 4)))).toString(16);
    });
  }

  private getContext(): TrackPayload['context'] {
    const nextContext = {
      library: this.getLibraryInfo(),
      page: this.getPageInfo(),
      userAgent: this.getUserAgent(),
      widgetId: this.chatRoom._id,
      widgetType: 'Chat Room',
      browserLanguage: this.getBrowserLanguage(),
    };

    return nextContext;
  }

  private getLibraryInfo(): { name: string; version: string } {
    return {
      name: 'arena-hub.min.js',
      version: this.getAPIVersion(),
    };
  }

  private getAPIVersion(): string {
    return '0.0.7';
  }

  private getUserAgent(): string {
    return this.global.navigator.userAgent;
  }

  private getBrowserLanguage(): string {
    return this.global.navigator.language;
  }
}
