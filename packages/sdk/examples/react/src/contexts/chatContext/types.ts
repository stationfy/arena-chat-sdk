import ArenaChat from '@arena-im/chat-sdk';
import { ChatMessage } from '@arena-im/chat-types';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';

export interface IChatContext {
  arenaChat: ArenaChat | null;
  liveChat: LiveChat | null;
  messages: ChatMessage[] | null;
}
