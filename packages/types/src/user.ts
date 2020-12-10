import { GroupChannel, PublicUserStatus } from './private-chat';

export interface User {
  _id: string;
  thumbnails: UserThumbnail;
  roles: UserRoles;
  userName: string;
  name: string;
}

export interface ExternalUser {
  id: string;
  name: string;
  image: string;
  email?: string;
  token?: string;
  metaData?: {
    [key: string]: string;
  };
  isModerator?: boolean;
  isBanned?: boolean;
  isAnonymous?: boolean;
}

export interface BanUser {
  anonymousId?: string;
  image?: string;
  name?: string;
  siteId: string;
  userId?: string;
}

interface UserThumbnail {
  raw: string;
}

type UserRoles = string[];

export interface ProviderUser {
  provider: string;
  username: string;
  profile: {
    urlName?: string;
    email?: string;
    username: string;
    displayName: string;
    name: {
      familyName: string;
      givenName: string;
    };
    profileImage: string;
    id: string;
  };
  metadata?: {
    [key: string]: string;
  };
}

export type UserChangedListener = (user: ExternalUser) => void;

export interface SSOExchangeResult {
  data: {
    user: {
      thumbnails: {
        raw: string;
      };
      functionType: [];
      isBanned: boolean;
      isModerator: boolean;
      adminType: [];
      tags: [];
      roles: string[];
      _id: string;
      userName: string;
      name: string;
      urlName: string;
      provider: string;
      providerUserId: string;
      profile: {
        urlName: string;
        email: string;
        username: string;
        displayName: string;
        name: {
          familyName: string;
          givenName: string;
        };
        id: string;
      };
      joinedAt: string;
      type: string;
    };
    token: string;
    firebaseToken: string;
  };
}

export interface PublicUser {
  _id: string;
  defaultImage?: boolean;
  groupChannels?: GroupChannel[];
  image?: string;
  isModerator?: boolean;
  name: string;
  status: PublicUserStatus;
  totalGroupChannelUnreadCount?: number;
  modLabel?: string;
  isBanned?: boolean;
  isBlocked?: boolean;
  bio?: string;
  socialLinks?: string[];
  userName?: string;
  location?: string;
}
