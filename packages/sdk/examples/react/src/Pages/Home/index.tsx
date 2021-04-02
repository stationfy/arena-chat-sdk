import React from 'react';

import { InputMessage, ListMessages, ProfileImage, ActionButton, Tab } from 'components';
import { Container, Header, Footer, List } from './styles';
import { send, sound, logout } from 'assets/icons';

//TODO: remove external image url

const Home: React.FC = () => {
  return (
    <Container>
      <Header>
        <Header.Info>
          <Header.ProfileArea>
            <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png" />

            <h1>Larissa Dornelas</h1>
          </Header.ProfileArea>
          <Header.SettingsArea>
            <ActionButton iconUrl={sound} action={() => {}} size={15} />
            <ActionButton iconUrl={logout} action={() => {}} size={15} />
          </Header.SettingsArea>
        </Header.Info>
        <Header.Tabs>
          <Tab />
        </Header.Tabs>
      </Header>
      <List>
        <ListMessages />
      </List>
      <Footer>
        <InputMessage />
        <ActionButton iconUrl={send} action={() => {}} hideOnMobile />
      </Footer>
    </Container>
  );
};

export { Home };
