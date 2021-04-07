import ArenaChat from '@arena-im/chat-sdk';
import { BasePolls, ChatMessage, ExternalUser } from '@arena-im/chat-types';
import { Channel } from '../../../../../dist/channel/channel';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';

export interface IChatContext {
  arenaChat: ArenaChat | null;
  liveChat: LiveChat | null;
  messages: ChatMessage[];
  user: ExternalUser | null;
  channel: Channel | null;
  polls: BasePolls | null;
  loadingUser: boolean;
  loadingMessages: boolean;
  allMessagesLoaded: boolean;
  handleLogin: () => void;
  handleLogout: () => void;
  handleLoadPrevMessages: (amount?: number) => void;
}

export interface IPollsVotedByUser {
  pollId: string;
  answerIndex: number;
}
