import { PublicUser } from './user';

export interface BaseUserProfile {
  getMeProfile(): Promise<PublicUser>;
  getUserProfile(userId: string): Promise<PublicUser>;
}
