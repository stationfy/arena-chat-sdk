import ArenaChat from 'arena-chat-sdk';
import { ChatMessage } from '../../dist/src/models/chat-message';
import { Channel } from '../../dist/src/channel/channel';
import { ExternalUser } from '../../dist/src/models/user';

const arenaChat = new ArenaChat('globoesporte');

const user = {
  image: 'https://randomuser.me/api/portraits/women/67.jpg',
  name: 'Eva Long',
  id: 'bear',
  email: 'eva.long@example.com',
};

arenaChat.setUser(user).then((user) => {
  console.log({ user });
});

let channel: Channel;

export async function initialize(callback: (message: ChatMessage) => void) {
  channel = await arenaChat.getChannel('twf1');

  channel.watchNewMessage(callback);

  const messages: ChatMessage[] = await channel.loadRecentMessages(20);

  return messages;
}

export async function sendMessage(text: string) {
  return channel.sendMessage(text);
}

export async function loadPrevious(): Promise<ChatMessage[]> {
  return channel.loadPreviousMessages(5);
}
