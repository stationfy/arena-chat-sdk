import React, { createContext, useCallback, useEffect, useState } from 'react';
import ArenaChat from '@arena-im/chat-sdk';
import { BasePolls, ChatMessage, ExternalUser, LiveChatChannel, Poll, QnaQuestion } from '@arena-im/chat-types';
import { v4 } from 'uuid';

import { CHAT_CHANNEL_ID, CHAT_SLUG, USER_EMAIL, USER_ID, USER_IMAGE, USER_NAME } from 'config-chat';
import { IChatContext } from './types';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';
import { Channel } from '../../../../../dist/channel/channel';
import { BaseQna } from '@arena-im/chat-types';

const ChatContext = createContext({} as IChatContext);

const ChatContextProvider = ({ children }: { children: React.ReactNode }) => {
  const [arenaChat, setArenaChat] = useState<ArenaChat | null>(null);
  const [liveChat, setLiveChat] = useState<LiveChat | null>(null);
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [channels, setChannels] = useState<LiveChatChannel[] | null>(null);
  const [pollsI, setPollsI] = useState<BasePolls | null>(null);
  const [pollsList, setPollsList] = useState<Poll[] | null>(null);
  const [questions, setQuestions] = useState<QnaQuestion[] | null>(null);
  const [qnaI, setQnaI] = useState<BaseQna | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [user, setUser] = useState<ExternalUser | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);
  const [loadingPreviousMessages, setLoadingPreviousMessages] = useState<boolean>(false);
  const [loadingChannelMessages, setLoadingChannelMessages] = useState<boolean>(true);

  const [allMessagesLoaded, setAllMessagesLoaded] = useState<boolean>(false);

  const connectChat = useCallback(async () => {
    try {
      const arenaChatConnection = new ArenaChat(CHAT_SLUG);
      const liveChatConnection = await arenaChatConnection.getLiveChat(CHAT_CHANNEL_ID);
      const channelConnection = liveChatConnection.getMainChannel();
      const channelsList = await liveChatConnection.getChannels();

      setArenaChat(arenaChatConnection);
      setLiveChat(liveChatConnection);
      setCurrentChannel(channelConnection);
      setChannels(channelsList);
    } catch (err) {
      console.error('Error (ChatContext):', err);
      alert('An error ocurred. See on console');
    }
  }, []);

  const startListeners = useCallback(() => {
    if (currentChannel) {
      currentChannel?.onMessageReceived((message) => {
        setMessages((oldValues) => [...oldValues, message]);
      });

      currentChannel?.onMessageDeleted((message) => {
        setMessages((oldValues) => oldValues.filter((item) => message.key !== item.key));
      });
    }
    if (pollsI) {
      pollsI?.onPollReceived((poll) => {
        setPollsList((oldValues) => (oldValues ? [poll, ...oldValues] : [poll]));
      });

      pollsI?.onPollModified((poll) => {
        setPollsList(
          (oldValues) => oldValues?.map((item) => (item._id === poll._id ? { ...poll } : { ...item })) ?? [],
        );
      });

      pollsI?.onPollDeleted((poll) => {
        setPollsList((oldValues) => oldValues?.filter((item) => poll._id !== item._id) ?? []);
      });
    }
    if (qnaI) {
      qnaI?.onQuestionReceived((question) => {
        setQuestions((oldValues) => (oldValues ? [question, ...oldValues] : [question]));
      });

      qnaI?.onQuestionModified((question) => {
        setQuestions(
          (oldValues) => oldValues?.map((item) => (item.key === question.key ? { ...question } : { ...item })) ?? [],
        );
      });

      qnaI?.onQuestionDeleted((question) => {
        setQuestions((oldValues) => oldValues?.filter((item) => item.key !== question.key) ?? []);
      });
    }
  }, [qnaI, pollsI, currentChannel]);

  const removeListeners = useCallback(() => {
    qnaI?.offQuestionDeleted();
    qnaI?.offQuestionModified();
    qnaI?.offQuestionReceived();
    pollsI?.offAllListeners();
    currentChannel?.offAllListeners();
  }, [qnaI, pollsI, currentChannel]);

  const handleLoadQuestions = useCallback(async () => {
    if (currentChannel) {
      try {
        const qnaI = await currentChannel.getChatQnaInstance();
        const questionsList = await qnaI.loadQuestions();

        setQnaI(qnaI);
        setQuestions(questionsList);
      } catch (err) {
        setQnaI(null);
        setQuestions(null);
      }
    }
  }, [currentChannel]);

  const handleLoadMessages = useCallback(async () => {
    if (currentChannel) {
      try {
        setLoadingChannelMessages(true);
        const newMessages = await currentChannel.loadRecentMessages(20);
        setMessages(newMessages);
      } catch (err) {
      } finally {
        setLoadingChannelMessages(false);
      }
    }
  }, [currentChannel]);

  async function handleLogin() {
    const newUser = {
      id: USER_ID,
      image: USER_IMAGE,
      name: USER_NAME,
      email: USER_EMAIL,
    };

    try {
      setLoadingUser(true);

      const result = await arenaChat?.setUser(newUser);

      setUser(result ?? null);
      handleLoadMessages();
    } catch (err) {
      console.error('Error (ChatContext):', err);
      alert('An error ocurred. See on console');
    } finally {
      setLoadingUser(false);
    }
  }

  function handleLogout() {
    arenaChat?.setUser(null);
    setUser(null);
  }

  async function handleToggleChannel(channelId: string) {
    try {
      setLoadingChannelMessages(true);
      const newChannel = await liveChat?.getChannel(channelId);
      if (newChannel) setCurrentChannel(newChannel as Channel);
    } catch (err) {
      console.error('Error (ChatContext):', err);
      alert('An error ocurred. See on console');
      setLoadingChannelMessages(false);
    }
  }

  async function handleLoadPrevMessages() {
    if (!allMessagesLoaded) {
      try {
        setLoadingPreviousMessages(true);
        const newMessages = (await currentChannel?.loadPreviousMessages(5)) ?? [];
        if (newMessages.length === 0) {
          setAllMessagesLoaded(true);
        } else setMessages((oldValues) => [...newMessages, ...oldValues]);
      } catch (err) {
        console.error('Error (ChatContext):', err);
        alert('An error ocurred. See on console');
      } finally {
        setTimeout(() => setLoadingPreviousMessages(false), 1000);
      }
    }
  }

  const handleLoadPolls = useCallback(async () => {
    if (currentChannel) {
      try {
        let anonymousId = '';
        if (!user) anonymousId = v4();

        const pollsConnection = await currentChannel.getPollsIntance(anonymousId);
        const newPollsList = await pollsConnection.loadPolls();

        setPollsI(pollsConnection);
        setPollsList(newPollsList);
      } catch (err) {
        console.error('Error (ChatContext):', err);
        alert('An error ocurred. See on console');
        setPollsI(null);
        setPollsList(null);
      }
    }
  }, [currentChannel, user]);

  useEffect(() => {
    connectChat();
  }, [connectChat]);

  useEffect(() => {
    handleLoadMessages();
  }, [handleLoadMessages]);

  useEffect(() => {
    handleLoadPolls();
  }, [handleLoadPolls]);

  useEffect(() => {
    startListeners();
    return () => removeListeners();
  }, [currentChannel, startListeners, removeListeners]);

  useEffect(() => {
    handleLoadQuestions();
  }, [handleLoadQuestions]);

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
        currentChannel,
        channels,
        handleLoadPrevMessages,
        loadingPreviousMessages,
        allMessagesLoaded,
        pollsI,
        handleToggleChannel,
        loadingChannelMessages,
        questions,
        qnaI,
        pollsList,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export { ChatContext, ChatContextProvider };
