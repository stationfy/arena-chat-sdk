import React, { useCallback, useContext, useMemo, useState } from 'react';

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

  const [messageValue, setMessageValue] = useState<string>('');
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

  const handleSetMessageValue = useCallback((value: string) => {
    setMessageValue(value);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (currentTabIndex === CurrentTabIndex.CHAT) {
      if (messageValue.length > 0) {
        try {
          setSendingMessage(true);
          await currentChannel?.sendMessage({ text: messageValue });
          setMessageValue('');
        } catch (err) {
          console.error('Error (Home):', err);
          alert('An error ocurred. See on console');
        } finally {
          setSendingMessage(false);
        }
      }
    } else if (currentTabIndex === CurrentTabIndex.QNA) {
      if (messageValue.length > 0) {
        try {
          setSendingMessage(true);
          await qnaI?.addQuestion(messageValue);
          setMessageValue('');
        } catch (err) {
          console.error('Error (Home):', err);
          alert('An error ocurred. See on console');
        } finally {
          setSendingMessage(false);
        }
      }
    }
  }, [currentChannel, messageValue, currentTabIndex, qnaI]);

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
        alert('An error ocurred. See on console');
        console.log('Error (Home):', err);
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
          <Header.ProfileArea>
            {user ? (
              <Header.ProfileArea>
                <ProfileImage imageUrl={user?.image ?? ''} size={50} />
                <h1>{user?.name ?? ''}</h1>
                {user?.isModerator && <ModeratorTag>MOD</ModeratorTag>}
              </Header.ProfileArea>
            ) : (
              <Header.LoginArea>
                <p>Sign in to send messages</p>
                <button disabled={loadingUser} onClick={handleLogin}>
                  {loadingUser ? <Loader size={12} /> : 'sign in'}
                </button>
              </Header.LoginArea>
            )}
          </Header.ProfileArea>
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
        {!currentChannel || loadingChannelMessages ? (
          <LoadingArea>
            <Loader />
          </LoadingArea>
        ) : (
          <>
            {currentTabIndex === CurrentTabIndex.CHAT && (
              <ListMessages
                messages={messages ?? []}
                seeAllQna={() => setCurrentTabIndex(CurrentTabIndex.QNA)}
                seeAllPoll={() => setCurrentTabIndex(CurrentTabIndex.POLLS)}
              />
            )}
            {currentTabIndex === CurrentTabIndex.CHANNELS && <ChannelsList toggleChannel={handleToggleChannel} />}
            {currentTabIndex === CurrentTabIndex.QNA && <Qna />}
            {currentTabIndex === CurrentTabIndex.POLLS && <Poll />}
          </>
        )}
      </List>
      {showFooter && (
        <Footer>
          <InputMessage setValue={handleSetMessageValue} value={messageValue} disabled={sendingMessage} />
          {sendingMessage ? <Loader /> : <ActionButton iconUrl={send} onClick={handleSendMessage} hideOnMobile />}
        </Footer>
      )}
    </Container>
  );
};

export { Home };
