import React, { createContext, useCallback, useEffect, useState } from 'react';
import ArenaChat from '@arena-im/chat-sdk';
import { ChatMessage } from '@arena-im/chat-types';

import { CHAT_CHANNEL_ID, CHAT_SLUG } from 'config-chat';
import { IChatContext } from './types';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';
import { Channel } from '../../../../../dist/channel/channel';

const ChatContext = createContext({} as IChatContext);

const ChatContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [arenaChat, setArenaChat] = useState<ArenaChat | null>(null);
  const [liveChat, setLiveChat] = useState<LiveChat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[] | null>(null);

  const connectChat = useCallback(async () => {
    try {
      const arenaChatConnection = new ArenaChat(CHAT_SLUG);
      const liveChatConnection = await arenaChatConnection.getLiveChat(CHAT_CHANNEL_ID);
      const channel = liveChatConnection.getMainChannel();

      setArenaChat(arenaChatConnection);
      setLiveChat(liveChatConnection);
      setChannel(channel);
    } catch (err) {
      console.log(err);
    }
  }, []);

  function handleLogin() {}

  const loadMessages = useCallback(async () => {
    if (channel) {
      const user = {
        image: 'https://randomuser.me/api/portraits/women/56.jpg',
        name: 'Naomi Carter',
        id: 'tornado',
        email: 'naomi.carter@example.com',
      };

      arenaChat?.setUser(user);
      console.log(arenaChat);

      const newMessages = await channel.loadRecentMessages(20);
      setMessages(newMessages);
    }
  }, [channel, arenaChat]);

  useEffect(() => {
    connectChat();
  }, [connectChat]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <ChatContext.Provider value={{ arenaChat: arenaChat, liveChat: liveChat, messages: messages }}>
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatContextProvider };
