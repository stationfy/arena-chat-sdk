import { PublicUser } from './user';

export interface BaseReaction {
  fetchReactions(messageId: string): Promise<ChannelMessageReactions>;
}

export interface ChannelMessageReactions {
  anonymousCount: number;
  total: number;
  items: {
    key: string;
    user: PublicUser;
    reaction: string;
  }[];
}

export interface MessageReactions {
  [type: string]: number;
}
