import { ExternalUser } from '@arena-im/chat-types';
import { RestAPI } from '../services/rest-api';
import { Credentials } from './credentials';
import { UserObservable } from './user-observable';

export class User {
  private static userInstance: User;
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
}
