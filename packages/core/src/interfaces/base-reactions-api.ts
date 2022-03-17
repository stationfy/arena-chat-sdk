import { ChannelReaction, ServerReaction } from '@arena-im/chat-types';

export interface BaseReactionsAPI {
  createReaction(reaction: ServerReaction): Promise<void>;
  fetchUserReactions(): Promise<ServerReaction[]>;
  fetchChannelReactions(): Promise<ChannelReaction[]>;
  watchUserReactions(callback: (reactions: ServerReaction[]) => void): () => void;
  watchChannelReactions(callback: (reactions: ChannelReaction[]) => void): () => void;
  watchReactionsErrors(callback: (error: any) => void): () => void;
  offAllListeners(): void;
  removeReaction(reaction: ServerReaction): Promise<ChannelReaction[]>;
}
