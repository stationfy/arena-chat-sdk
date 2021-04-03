import React, { useContext, useState } from 'react';
import { ExternalUser } from '@arena-im/chat-types';

import { InputMessage, ListMessages, ProfileImage, ActionButton, Tab, Loader } from 'components';
import { Container, Header, Footer, List } from './styles';
import { send, sound, logout } from 'assets/icons';
import { ChatContext } from 'contexts/chatContext/chatContext';

//TODO: remove external image url

const Home: React.FC = () => {
  const { arenaChat, liveChat, messages } = useContext(ChatContext);

  const [user, setUser] = useState<ExternalUser | null>(null);
  const [loadingUser, setLoadingUser] = useState<boolean>(false);

  async function handleLogin() {
    const newUser = {
      image: 'https://randomuser.me/api/portraits/women/56.jpg',
      name: 'Naomi Carter',
      id: 'tornado',
      email: 'naomi.carter@example.com',
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
              <ActionButton
                iconUrl={sound}
                onClick={() => {
                  console.log('oi');
                }}
                size={15}
              />
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
          <InputMessage />
          <ActionButton
            iconUrl={send}
            onClick={() => {
              console.log('oi');
            }}
            hideOnMobile
          />
        </Footer>
      )}
    </Container>
  );
};

export { Home };
