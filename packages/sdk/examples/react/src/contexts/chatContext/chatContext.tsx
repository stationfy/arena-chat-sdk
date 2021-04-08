import React, { createContext, useCallback, useEffect, useState } from 'react';
import ArenaChat from '@arena-im/chat-sdk';
import { BasePolls, ChatMessage, ExternalUser, LiveChatChannel, Poll, QnaQuestion } from '@arena-im/chat-types';

import { CHAT_CHANNEL_ID, CHAT_SLUG, USER_EMAIL, USER_ID, USER_IMAGE, USER_NAME } from 'config-chat';
import { IChatContext } from './types';
import { LiveChat } from '../../../../../dist/live-chat/live-chat';
import { Channel } from '../../../../../dist/channel/channel';
import { generateRandomString } from 'utils/generateRandomString';
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
      alert('An error ocurred. See on console');
      console.log('Error (ChatContext):', err);
    }
  }, []);

  const initializePollsListeners = useCallback(() => {
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
  }, [pollsI]);

  const initializeQnaListeners = useCallback(() => {
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
  }, [qnaI]);

  const initializeChannelListeners = useCallback(() => {
    if (currentChannel) {
      currentChannel?.onMessageReceived((message) => {
        setMessages((oldValues) => [...oldValues, message]);
      });

      currentChannel?.onMessageDeleted((message) => {
        setMessages((oldValues) => oldValues.filter((item) => message.key !== item.key));
      });
    }
  }, [currentChannel]);

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
      alert('An error ocurred. See on console');
      console.log('Error (ChatContext):', err);
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
      if (newChannel) {
        qnaI?.offQuestionDeleted();
        qnaI?.offQuestionModified();
        qnaI?.offQuestionReceived();
        pollsI?.offAllListeners();
        currentChannel?.offAllListeners();

        setCurrentChannel(newChannel as Channel);
      }
    } catch (err) {
      alert('An error ocurred. See on console');
      console.log('Error (ChatContext):', err);
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
        alert('An error ocurred. See on console');
        console.log('Error (ChatContext):', err);
      } finally {
        setTimeout(() => setLoadingPreviousMessages(false), 1000);
      }
    }
  }

  const handleLoadPolls = useCallback(async () => {
    if (currentChannel) {
      try {
        let anonymousId = '';
        if (!user) anonymousId = generateRandomString(16);

        const pollsConnection = await currentChannel.getPollsIntance(anonymousId);
        const newPollsList = await pollsConnection.loadPolls();

        setPollsI(pollsConnection);
        setPollsList(newPollsList);
      } catch (err) {
        alert('An error ocurred. See on console');
        console.log('Error (ChatContext):', err);
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
    initializeChannelListeners();
  }, [initializeChannelListeners]);

  useEffect(() => {
    initializePollsListeners();
  }, [initializePollsListeners]);

  useEffect(() => {
    handleLoadPolls();
  }, [handleLoadPolls]);

  useEffect(() => {
    initializeQnaListeners();
  }, [initializeQnaListeners]);

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
