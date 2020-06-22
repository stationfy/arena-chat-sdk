import ArenaChat from 'arena-chat-sdk';
import { ChatMessage } from '../../dist/src/types/chat-message';
import { Channel } from '../../dist/src/channel/channel';

const arenaChat = new ArenaChat('globoesporte');
let channel: Channel;

export async function initialize(callback: (message: ChatMessage) => void) {
  channel = await arenaChat.getChannel('twf1');

  channel.watchNewMessage(callback);

  const messages: ChatMessage[] = await channel.loadRecentMessages(10);

  return messages;
}

export async function sendMessage(text: string) {
  return channel.sendMessage(text);
}
