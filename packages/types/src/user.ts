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
}

export interface BanUser {
  anonymousId?: string;
  image: string;
  name: string;
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
