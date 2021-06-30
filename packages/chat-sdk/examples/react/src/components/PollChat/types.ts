import { Poll } from '@arena-im/chat-types';

export interface IPoll {
  poll: Poll;
  seeAllButton?: () => void;
}
