export interface User {
  _id: string;
  thumbnails: UserThumbnail;
  roles: UserRoles;
  userName: string;
  name: string;
}

export interface BanUser {
  anonymousId: string;
  image: string;
  name: string;
  siteId: string;
  userId: string;
}

interface UserThumbnail {
  raw: string;
}

type UserRoles = string[];
