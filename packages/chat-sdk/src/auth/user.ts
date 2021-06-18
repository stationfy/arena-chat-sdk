import { ExternalUser } from '@arena-im/chat-types';
import { createObserver, Listerner } from '../utils/observer';
import { ArenaChat } from '../sdk';
import { RestAPI } from '../services/rest-api';

type UserEvent = ExternalUser | null;

export class User {
  private static userInstance: User;
  private userChangedListeners = createObserver<UserEvent>();
  public data: ExternalUser | null = null;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  public static get instance(): User {
    if (!User.userInstance) {
      User.userInstance = new User();
    }

    return User.userInstance;
  }

  /**
   * Whatch set a new user
   *
   * @param listener subscribe function
   * @returns unsubscribe function
   */
  public onUserChanged(listener: Listerner<UserEvent>): () => void {
    return this.userChangedListeners.subscribe(listener)
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
      provider: ArenaChat.apiKey,
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

    this.userChangedListeners.publish(this.data)

    return this.data;
  }

  public setInternalUser(user: ExternalUser): ExternalUser | null {
    this.userChangedListeners.publish(user)

    this.data = user;

    return this.data;
  }

  /**
   * Unset user
   *
   */
  public unsetUser(): void {
    this.data = null;

    this.userChangedListeners.publish(null)
  }
}
