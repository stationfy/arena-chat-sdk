import ArenaChat from '@arena-im/chat-sdk';
import { BaseQna } from '@arena-im/chat-types';
import { Poll } from '@arena-im/chat-types';
import { BaseChannel, BasePolls, ChatMessage, ExternalUser, LiveChatChannel, QnaQuestion } from '@arena-im/chat-types';
import { Channel } from '../../../../../dist/channel/channel';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';

export interface IChatContext {
  arenaChat: ArenaChat | null;
  liveChat: LiveChat | null;
  messages: ChatMessage[];
  user: ExternalUser | null;
  currentChannel: Channel | null;
  channels: LiveChatChannel[] | null;
  pollsI: BasePolls | null;
  pollsList: Poll[] | null;
  loadingUser: boolean;
  loadingPreviousMessages: boolean;
  loadingChannelMessages: boolean;
  allMessagesLoaded: boolean;
  questions: QnaQuestion[] | null;
  qnaI: BaseQna | null;
  handleLogin: () => void;
  handleLogout: () => void;
  handleLoadPrevMessages: (amount?: number) => void;
  handleToggleChannel: (channelId: string) => void;
}

export interface IPollsVotedByUser {
  pollId: string;
  answerIndex: number;
}
