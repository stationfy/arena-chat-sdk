import { ExternalUser } from './user';

export interface BasePolls {
  loadPolls(filter?: PollFilter, limit?: number): Promise<Poll[]>;
  pollVote(pollId: string, optionId: number, anonymousId?: string): Promise<boolean>;
  offPollReceived(): void;
  onPollReceived(callback: (poll: Poll) => void): void;
  offPollModified(): void;
  onPollModified(callback: (poll: Poll) => void): void;
  offPollDeleted(): void;
  onPollDeleted(callback: (poll: Poll) => void): void;
  offAllListeners(): void;
  watchUserPollsReactions(userId: string): void;
  onUserChanged(user: ExternalUser | null): void;
}

export interface Poll {
  _id: string;
  chatRoomId: string;
  createdAt: number;
  createBy: string;
  draft: boolean;
  duration: number;
  options: PollOption[];
  publishedAt: number;
  question: string;
  showVotes: boolean;
  siteId: string;
  total: number;
  updatedAt: number;
  expireAt: number;
  currentUserVote?: number;
  changeType?: string;
}

export enum PollFilter {
  POPULAR = 'popular',
  RECENT = 'recent',
  ACTIVE = 'active',
  ENDED = 'ended',
}

interface PollOption {
  name: string;
  total: number;
}
