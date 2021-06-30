import { ExternalUser } from '@arena-im/chat-types';
import { UserObservable } from '../auth';
import { WebSocketTransport } from '../transports/websocket-transport';

type EmitJoin = {
  channelId: string;
  siteId: string;
  user: Partial<ExternalUser>;
};

type EmitEvents = {
  join: (join: EmitJoin) => void;
  'user.setdata': (user: Partial<ExternalUser>) => void;
  list: (
    options: { channelId: string; status: 'online' | 'offline' },
    cb: (error: Error | null, data: ExternalUser[]) => void,
  ) => void;
};

type LitenEvents = {
  reconnect: () => void;
  'presence.info': (data: { onlineCount: number }) => void;
  'user.joined': (user: ExternalUser) => void;
  'user.left': (user: ExternalUser) => void;
};

export class PresenceAPI {
  private wsTransport: WebSocketTransport<LitenEvents, EmitEvents>;
  private currentUser: Partial<ExternalUser> | null = null;

  public constructor(private siteId: string, private channelId: string) {
    this.wsTransport = new WebSocketTransport();
    this.wsTransport.client.on('reconnect', this.onReconnect);

    UserObservable.instance.onUserChanged(this.handleUserChange.bind(this));
  }

  private handleUserChange(user: Partial<ExternalUser> | null) {
    let nextUser = user;

    if (nextUser === null) {
      nextUser = {
        isAnonymous: true,
        id: `${+new Date()}`,
      };
    }

    this.updateUser(nextUser);
  }

  private onReconnect() {
    if (this.currentUser) {
      this.join(this.currentUser);
    }
  }

  public join(user: Partial<ExternalUser>): void {
    this.currentUser = user;

    this.wsTransport.client.emit('join', {
      channelId: this.channelId,
      siteId: this.siteId,
      user,
    });
  }

  public updateUser(user: Partial<ExternalUser>): void {
    this.wsTransport.client.emit('user.setdata', user);
  }

  public getAllOnlineUsers(): Promise<ExternalUser[]> {
    return new Promise((resolve, reject) => {
      this.wsTransport.client.emit('list', { channelId: this.channelId, status: 'online' }, (err, data) => {
        if (err) {
          return reject(err);
        }

        resolve(data);
      });
    });
  }

  public watchOnlineCount(callback: (onlineCount: number) => void): void {
    this.wsTransport.client.on('presence.info', ({ onlineCount }) => {
      callback(onlineCount);
    });
  }

  public watchUserJoined(callback: (user: ExternalUser) => void): void {
    this.wsTransport.client.on('user.joined', callback);
  }

  public watchUserLeft(callback: (user: ExternalUser) => void): void {
    this.wsTransport.client.on('user.left', callback);
  }
}
