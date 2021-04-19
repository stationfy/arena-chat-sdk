import { ChatRoom, TrackContext, TrackPageInfo, TrackPayload } from '@arena-im/chat-types';
import { getGlobalObject } from '../utils/misc';
import { ArenaChat } from '../sdk';
import { RestAPI } from './rest-api';

export class ArenaHub {
  private global = getGlobalObject<Window>();
  public constructor(private chatRoom: ChatRoom, private sdk: ArenaChat) {}

  public async track(type: string, anonymousId?: string): Promise<{ success: boolean }> {
    if (this.sdk.site === null) {
      throw new Error('Cannot call arena hub without a site id');
    }

    const trackObj: TrackPayload = {
      userId: this.sdk.user?.id || null,
      anonymousId: anonymousId || this.getMessageId(),
      type: type,
      context: this.getContext(),
      messageId: this.getMessageId(),
      timestamp: this.getTimestamp(),
      writeKey: this.sdk.site._id,
      sentAt: this.getTimestamp(),
      properties: this.getPageInfo(),
      arenaUserId: this.sdk.user?.id || null,
    };

    return this.sendRequest(trackObj);
  }

  private async sendRequest(trackObj: TrackPayload): Promise<{ success: boolean }> {
    const restAPI = RestAPI.getAPINoauthInstance();
    return await restAPI.collect(trackObj);
  }

  private getPageInfo(): TrackPageInfo {
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

  private getContext(): TrackContext {
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
