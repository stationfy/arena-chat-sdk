import { ExternalUser } from '@arena-im/chat-types';
import { createBehaviorObserver, Listerner } from '../utils/observer';

type UserEvent = ExternalUser | null;

export class UserObservable {
  private static userObervableInstance: UserObservable;
  private userChangedListeners = createBehaviorObserver<UserEvent>(null);

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static get instance(): UserObservable {
    if (!UserObservable.userObervableInstance) {
      UserObservable.userObervableInstance = new UserObservable();
    }

    return UserObservable.userObervableInstance;
  }

  /**
   * Whatch set a new user
   *
   * @param listener subscribe function
   * @returns unsubscribe function
   */
  public onUserChanged(listener: Listerner<UserEvent>): () => void {
    return this.userChangedListeners.subscribe(listener);
  }

  public updateUser(user: ExternalUser | null): void {
    this.userChangedListeners.publish(user);
  }
}
