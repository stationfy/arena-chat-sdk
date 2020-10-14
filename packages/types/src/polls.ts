export interface BasePolls {
  loadPolls(filter?: PollFilter, limit?: number): Promise<Poll[]>;
}

export interface Poll {
  _id: string;
  chatRoomId: string;
  createdAt: number;
  createBy: string;
  draft: boolean;
  duration: number;
  options: {
    name: string;
    total: number;
  };
  publishedAt: number;
  question: string;
  showVotes: boolean;
  siteId: string;
  total: number;
  updatedAt: number;
}

export enum PollFilter {
  POPULAR = 'popular',
  RECENT = 'recent',
  ACTIVE = 'active',
  ENDED = 'ended',
}
