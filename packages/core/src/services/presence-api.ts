import { ExternalUser, PresenceUser } from '@arena-im/chat-types';
import { isMobile } from '../utils/misc';
import { User, UserObservable } from '../auth';
import { WebSocketTransport } from '../transports/websocket-transport';

type ChannelType = 'liveblog' | 'chat_room';

export class PresenceAPI {
  private currentUser: PresenceUser | null = null;

  public constructor(private siteId: string, private channelId: string, private channelType: ChannelType) {
    WebSocketTransport.instance.on('reconnect', this.onReconnect);

    this.joinUser();
    UserObservable.instance.onUserChanged(this.handleUserChange.bind(this));
  }

  private async joinUser() {
    const userToJoin = await this.buildPresenceUser(User.instance.data);

    this.join(userToJoin);
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

  public join(user: PresenceUser | null): void {
    this.currentUser = user;

    WebSocketTransport.instance.emit('join', {
      channelId: this.channelId,
      siteId: this.siteId,
      channelType: this.channelType,
      user,
    });
  }

  public updateUser(user: PresenceUser): void {
    WebSocketTransport.instance.emit('user.setdata', user);
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
    WebSocketTransport.instance.on('presence.info', ({ onlineCount }) => {
      callback(onlineCount);
    });
  }

  public watchUserJoined(callback: (user: ExternalUser) => void): void {
    WebSocketTransport.instance.on('user.joined', callback);
  }

  public watchUserLeft(callback: (user: ExternalUser) => void): void {
    WebSocketTransport.instance.on('user.left', callback);
  }
}
