import { PresenceInfo, PresenceUser } from '@arena-im/chat-types';
import { createObserver, Listerner } from '../utils/observer';

type Instance = {
  [key: string]: PresenceObservable;
};

export class PresenceObservable {
  private static instance: Instance = {};
  private userChangedListeners = createObserver<PresenceUser>();
  private userSettedListeners = createObserver<boolean>();
  private onlineCountListeners = createObserver<number>();
  private presenceInfoListeners = createObserver<PresenceInfo>();

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static getInstance(channelId: string): PresenceObservable {
    if (!this.instance[channelId]) {
      this.instance[channelId] = new PresenceObservable();
    }

    return this.instance[channelId];
  }

  public onUserJoinedChanged(listener: Listerner<PresenceUser>): () => void {
    return this.userChangedListeners.subscribe(listener);
  }

  public updateUserJoined(user: PresenceUser): void {
    this.userChangedListeners.publish(user);
  }

  public onUserSettedChanged(listener: Listerner<boolean>): () => void {
    return this.userSettedListeners.subscribe(listener);
  }

  public updateUserSetted(user: boolean): void {
    this.userSettedListeners.publish(user);
  }

  public onOnlineCountChanged(listener: Listerner<number>): () => void {
    return this.onlineCountListeners.subscribe(listener);
  }

  public onPresenceInfoChanged(listener: Listerner<PresenceInfo>): () => void {
    return this.presenceInfoListeners.subscribe(listener);
  }

  public updateOnlineCount(onlineCount: number): void {
    this.onlineCountListeners.publish(onlineCount);
  }

  public updateVisitors(presenceInfo: PresenceInfo): void {
    this.presenceInfoListeners.publish(presenceInfo);
  }
}
