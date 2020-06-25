import ArenaChat from 'arena-chat-sdk';
import { Channel } from '../../../dist/channel/channel';
import { ChatMessage } from '../../../dist/models/chat-message';

export const arenaChat = new ArenaChat('globoesporte');

let channel: Channel;

export async function initChannel(channelId: string) {
  channel = await arenaChat.getChannel(channelId);
}

export async function loadRecentMessages(total: number) {
  const messages = await channel.loadRecentMessages(total);

  return messages;
}

export function watchNewMessage(callback: (message: ChatMessage) => void) {
  channel.watchNewMessage(callback);
}

export async function sendMessage(text: string) {
  return channel.sendMessage(text);
}

export async function loadPrevious(): Promise<ChatMessage[]> {
  return channel.loadPreviousMessages(5);
}
