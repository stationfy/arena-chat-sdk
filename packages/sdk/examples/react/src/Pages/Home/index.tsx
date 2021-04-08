import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  InputMessage,
  ListMessages,
  ProfileImage,
  ActionButton,
  Tabs,
  Loader,
  ChannelsList,
  Qna,
  Poll,
} from 'components';
import { Container, Header, Footer, List, ModeratorButton, ModeratorTag } from './styles';
import { send, sound, logout, add } from 'assets/icons';
import { ChatContext } from 'contexts/chatContext/chatContext';

import { LoadingArea } from 'components/ListMessages/styles';
import { CurrentTabIndex } from 'components/Tabs/types';

const Home: React.FC = () => {
  const {
    currentChannel,
    messages,
    handleLogin,
    handleLogout,
    loadingUser,
    user,
    loadingChannelMessages,
    handleToggleChannel: toggleChannel,
    qnaI,
  } = useContext(ChatContext);

  const [inputValue, setInputValue] = useState<string>('');
  const [sendingMessage, setSendingMessage] = useState<boolean>(false);
  const [currentTabIndex, setCurrentTabIndex] = useState<CurrentTabIndex>(CurrentTabIndex.CHAT);
  const [showModeratorButton, setShowModeratorButton] = useState<boolean>(false);
  const [requestingModeration, setRequestingModeration] = useState<boolean>(false);

  const showFooter = useMemo(
    () => user && (currentTabIndex === CurrentTabIndex.CHAT || currentTabIndex === CurrentTabIndex.QNA),
    [currentTabIndex, user],
  );

  const handleRequestModerationButton = useCallback(() => {
    setShowModeratorButton(!showModeratorButton);
  }, [showModeratorButton]);

  const handleToggleTab = useCallback((indexTab: number) => {
    setCurrentTabIndex(indexTab);
  }, []);

  const handleInput = useCallback((e) => {
    setInputValue(e.currentTarget.innerText);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (currentTabIndex === CurrentTabIndex.CHAT) {
      if (inputValue.length > 0) {
        try {
          setSendingMessage(true);
          await currentChannel?.sendMessage({ text: inputValue });
          setInputValue('');
        } catch (err) {
        } finally {
          setSendingMessage(false);
        }
      }
    } else if (currentTabIndex === CurrentTabIndex.QNA) {
      if (inputValue.length > 0) {
        try {
          setSendingMessage(true);
          await qnaI?.addQuestion(inputValue);
          setInputValue('');
        } catch (err) {
        } finally {
          setSendingMessage(false);
        }
      }
    }
  }, [currentChannel, inputValue, currentTabIndex, qnaI]);

  const getLoginArea = () => {
    return (
      <Header.LoginArea>
        <p>Sign in to send messages</p>
        <button disabled={loadingUser} onClick={handleLogin}>
          {loadingUser ? <Loader size={12} /> : 'sign in'}
        </button>
      </Header.LoginArea>
    );
  };

  const getProfileArea = () => {
    return (
      <Header.ProfileArea>
        <ProfileImage imageUrl={user?.image ?? ''} size={50} />
        <h1>{user?.name ?? ''}</h1>
        {user?.isModerator && <ModeratorTag>MOD</ModeratorTag>}
      </Header.ProfileArea>
    );
  };

  const getListMessagesArea = () => {
    if (currentChannel) {
      return loadingChannelMessages ? (
        <LoadingArea>
          <Loader />
        </LoadingArea>
      ) : (
        <ListMessages
          messages={messages ?? []}
          seeAllQna={() => setCurrentTabIndex(CurrentTabIndex.QNA)}
          seeAllPoll={() => setCurrentTabIndex(CurrentTabIndex.POLLS)}
        />
      );
    } else {
      return (
        <LoadingArea>
          <Loader />
        </LoadingArea>
      );
    }
  };

  const handleToggleChannel = useCallback(
    (channelId: string) => {
      toggleChannel(channelId);
      handleToggleTab(CurrentTabIndex.CHAT);
    },
    [toggleChannel, handleToggleTab],
  );

  const handleRequestModeration = useCallback(async () => {
    if (user && !requestingModeration) {
      setRequestingModeration(true);
      try {
        await currentChannel?.requestModeration();
      } catch (err) {
      } finally {
        setRequestingModeration(false);
        setShowModeratorButton(false);
      }
    }
  }, [currentChannel, user, requestingModeration]);

  return (
    <Container>
      <Header>
        <Header.Info>
          <Header.ProfileArea>{user ? getProfileArea() : getLoginArea()}</Header.ProfileArea>
          {user && (
            <Header.SettingsArea>
              {!user.isModerator && <ActionButton iconUrl={add} onClick={handleRequestModerationButton} size={15} />}
              <ActionButton iconUrl={sound} onClick={() => {}} size={15} />
              <ActionButton iconUrl={logout} onClick={handleLogout} size={15} />
              {showModeratorButton && (
                <ModeratorButton onClick={handleRequestModeration}>
                  {!requestingModeration ? 'Request Moderation' : <Loader />}
                </ModeratorButton>
              )}
            </Header.SettingsArea>
          )}
        </Header.Info>
        <Header.Tabs>
          <Tabs currentTabIndex={currentTabIndex} toggleTab={handleToggleTab} />
        </Header.Tabs>
      </Header>
      <List>
        {currentTabIndex === CurrentTabIndex.CHAT && getListMessagesArea()}
        {currentTabIndex === CurrentTabIndex.CHANNELS && <ChannelsList toggleChannel={handleToggleChannel} />}
        {currentTabIndex === CurrentTabIndex.QNA && <Qna />}
        {currentTabIndex === CurrentTabIndex.POLLS && <Poll />}
      </List>
      {showFooter && (
        <Footer>
          <InputMessage onInput={handleInput} value={inputValue} disabled={sendingMessage} />
          {sendingMessage ? <Loader /> : <ActionButton iconUrl={send} onClick={handleSendMessage} hideOnMobile />}
        </Footer>
      )}
    </Container>
  );
};

export { Home };
