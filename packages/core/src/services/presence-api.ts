import { ChannelType, ExternalUser, PresenceUser } from '@arena-im/chat-types';
import { isMobile } from '../utils/misc';
import { User, UserObservable } from '../auth';
import { WebSocketTransport } from '../transports/websocket-transport';
import { PresenceObservable } from './presence-observable';

type Instance = {
  [key: string]: PresenceAPI;
};

export class PresenceAPI {
  private static instance: Instance = {};
  private currentUser: PresenceUser | null = null;
  private cachedOnlineCount: number | null = null;

  private constructor(private siteId: string, private channelId: string, private channelType: ChannelType) {
    WebSocketTransport.instance.on('reconnect', this.onReconnect);

    UserObservable.instance.onUserChanged(this.handleUserChange.bind(this));
  }

  public static getInstance(siteId: string, channelId: string, channelType: ChannelType): PresenceAPI {
    if (!this.instance[channelId]) {
      this.instance[channelId] = new PresenceAPI(siteId, channelId, channelType);
    }

    return this.instance[channelId];
  }

  public async joinUser(): Promise<boolean> {
    const userToJoin = await this.buildPresenceUser(User.instance.data);

    return this.join(userToJoin);
  }

  private async buildPresenceUser(user: Partial<ExternalUser> | null) {
    const country = await User.instance.loadCountry();

    return {
      isMobile: isMobile(),
      userId: user?.id ?? User.instance.anonymousId,
      isAnonymous: !user,
      name: user?.name ?? null,
      image: user?.image ?? null,
      country,
    };
  }

  private async handleUserChange(user: ExternalUser) {
    const nextUser = await this.buildPresenceUser(user);

    this.updateUser(nextUser);
  }

  private onReconnect() {
    if (this.currentUser) {
      this.join(this.currentUser);
    }
  }

  private join(user: PresenceUser): Promise<boolean> {
    this.currentUser = user;

    return new Promise((resolve, reject) => {
      WebSocketTransport.instance.emit(
        'join',
        {
          channelId: this.channelId,
          siteId: this.siteId,
          channelType: this.channelType,
          user,
        },
        (err: Record<string, unknown> | null, data: boolean) => {
          if (err) {
            return reject(err);
          }

          this.handleUserJoined(user);
          resolve(data);
        },
      );
    });
  }

  private handleUserJoined(user: PresenceUser) {
    PresenceObservable.getInstance(this.channelId).updateUserJoined(user);

    this.watchOnlineCountEvent((onlineCount) => {
      PresenceObservable.getInstance(this.channelId).updateOnlineCount(onlineCount);
    });
  }

  public updateUser(user: PresenceUser): void {
    WebSocketTransport.instance.emit('user.setdata', user);
    PresenceObservable.getInstance(this.channelId).updateUserSetted(true);
  }

  public getAllOnlineUsers(): Promise<ExternalUser[]> {
    return new Promise((resolve, reject) => {
      WebSocketTransport.instance.emit(
        'list',
        {
          channelId: this.channelId,
          status: 'online',
        },
        (err: Record<string, unknown> | null, data: ExternalUser[]) => {
          if (err) {
            return reject(err);
          }

          resolve(data);
        },
      );
    });
  }

  public watchOnlineCount(callback: (onlineCount: number) => void): void {
    if (this.cachedOnlineCount) {
      callback(this.cachedOnlineCount);
    }

    PresenceObservable.getInstance(this.channelId).onOnlineCountChanged(callback);
  }

  private watchOnlineCountEvent(callback: (onlineCount: number) => void) {
    WebSocketTransport.instance.on('presence.info', ({ onlineCount }) => {
      this.cachedOnlineCount = onlineCount;
      callback(onlineCount);
    });
  }

  public watchUserJoined(callback: (user: ExternalUser) => void): void {
    WebSocketTransport.instance.on('user.joined', callback);
  }

  public watchUserLeft(callback: (user: ExternalUser) => void): void {
    WebSocketTransport.instance.on('user.left', callback);
  }

  public offAllListeners(): void {
    WebSocketTransport.instance.off('presence.info');
    WebSocketTransport.instance.off('user.joined');
    WebSocketTransport.instance.off('user.left');
  }
}
