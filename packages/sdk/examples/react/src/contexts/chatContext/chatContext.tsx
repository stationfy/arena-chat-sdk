import React, { createContext, useCallback, useEffect, useState } from 'react';
import ArenaChat from '@arena-im/chat-sdk';
import { ChatMessage, ExternalUser } from '@arena-im/chat-types';

import { CHAT_CHANNEL_ID, CHAT_SLUG, USER_EMAIL, USER_ID, USER_IMAGE, USER_NAME } from 'config-chat';
import { IChatContext } from './types';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';
import { Channel } from '../../../../../dist/channel/channel';

const ChatContext = createContext({} as IChatContext);

const ChatContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [arenaChat, setArenaChat] = useState<ArenaChat | null>(null);
  const [liveChat, setLiveChat] = useState<LiveChat | null>(null);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<ExternalUser | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);
  const [loadingMessages, setLoadingMessages] = useState<boolean>(false);
  const [allMessagesLoaded, setAllMessagesLoaded] = useState<boolean>(false);

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

  async function handleLogin() {
    const newUser = {
      id: USER_ID,
      image: USER_IMAGE,
      name: USER_NAME,
      email: USER_EMAIL,
    };

    try {
      setLoadingUser(true);
      await arenaChat?.setUser(newUser);
      setUser(newUser);
    } catch (err) {
      console.log(err);
    } finally {
      setLoadingUser(false);
    }
  }

  function handleLogout() {
    arenaChat?.setUser(null);

    setUser(null);
  }

  async function handleLoadPrevMessages() {
    if (!allMessagesLoaded) {
      try {
        setLoadingMessages(true);
        const newMessages = (await channel?.loadPreviousMessages(5)) ?? [];
        if (newMessages.length === 0) {
          setAllMessagesLoaded(true);
        } else setMessages((oldValues) => [...newMessages, ...oldValues]);
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingMessages(false);
      }
    }
  }

  channel?.onMessageReceived((message) => {
    setMessages((oldValues) => [...oldValues, message]);
  });

  const loadMessages = useCallback(async () => {
    if (channel) {
      try {
        setLoadingMessages(true);
        const newMessages = await channel.loadRecentMessages(20);
        setMessages(newMessages);
      } catch (err) {
        console.log(err);
      } finally {
        setLoadingMessages(false);
      }
    }
  }, [channel]);

  useEffect(() => {
    connectChat();
  }, [connectChat]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  return (
    <ChatContext.Provider
      value={{
        arenaChat,
        liveChat,
        messages,
        handleLogin,
        handleLogout,
        loadingUser,
        user,
        channel,
        handleLoadPrevMessages,
        loadingMessages,
        allMessagesLoaded,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatContextProvider };
