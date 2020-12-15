import { PublicUser, PublicUserInput } from './user';

export interface BaseUserProfile {
  getMeProfile(): Promise<PublicUser>;
  getUserProfile(userId: string): Promise<PublicUser>;
  updateUserProfile(user: PublicUserInput): Promise<PublicUser>;
}
