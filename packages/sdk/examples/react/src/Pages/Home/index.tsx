import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { InputMessage, ListMessages, ProfileImage, ActionButton, Tab, Loader } from 'components';
import { Container, Header, Footer, List } from './styles';
import { send, sound, logout } from 'assets/icons';
import { ChatContext } from 'contexts/chatContext/chatContext';

const Home: React.FC = () => {
  const { channel, messages, handleLogin, handleLogout, loadingUser, user } = useContext(ChatContext);

  const [inputValue, setInputValue] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);

  const handleInput = useCallback((e) => {
    setInputValue(e.currentTarget.innerText);
  }, []);

  const handleSendMessage = useCallback(async () => {
    if (inputValue.length > 0) {
      try {
        setSendingMessage(true);
        await channel?.sendMessage({ text: inputValue });
        setInputValue('');
      } catch (err) {
        console.log(err);
      } finally {
        console.log('sai');
        setSendingMessage(false);
      }
    }
  }, [channel, inputValue]);

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
      </Header.ProfileArea>
    );
  };

  return (
    <Container>
      <Header>
        <Header.Info>
          <Header.ProfileArea>{user ? getProfileArea() : getLoginArea()}</Header.ProfileArea>
          {user && (
            <Header.SettingsArea>
              <ActionButton iconUrl={sound} onClick={() => {}} size={15} />
              <ActionButton iconUrl={logout} onClick={handleLogout} size={15} />
            </Header.SettingsArea>
          )}
        </Header.Info>
        <Header.Tabs>
          <Tab />
        </Header.Tabs>
      </Header>
      <List>
        <ListMessages messages={messages ?? []} />
      </List>
      {user && (
        <Footer>
          <InputMessage onInput={handleInput} value={inputValue} disabled={sendingMessage} />
          {sendingMessage ? <Loader /> : <ActionButton iconUrl={send} onClick={handleSendMessage} hideOnMobile />}
        </Footer>
      )}
    </Container>
  );
};

export { Home };
