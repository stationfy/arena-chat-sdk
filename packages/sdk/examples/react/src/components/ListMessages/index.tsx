import React from 'react';

import { Message } from 'components';

import { Container, FollowedMessage, MessageItem } from './styles';
import { ProfileImage } from 'components/ProfileImage';

const ListMessages: React.FC = () => {
  return (
    <Container>
      <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <Message owner>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png"></ProfileImage>
          <Message>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <Message owner>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png"></ProfileImage>
          <Message>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <Message owner>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png"></ProfileImage>
          <Message>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <Message owner>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png"></ProfileImage>
          <Message>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <Message owner>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png"></ProfileImage>
          <Message>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <Message owner>oi</Message>
        </MessageItem.Content>
      </MessageItem>
      <MessageItem>
        <MessageItem.Info>
          <p>Larissa Dornelas</p> <span>Mar 29, 2021 5:30 PM</span>
        </MessageItem.Info>
        <MessageItem.Content>
          <ProfileImage imageUrl="https://iupac.org/wp-content/uploads/2018/05/default-avatar.png"></ProfileImage>
          <Message>oi</Message>
        </MessageItem.Content>
      </MessageItem>
    </Container>
  );
};

export { ListMessages };
