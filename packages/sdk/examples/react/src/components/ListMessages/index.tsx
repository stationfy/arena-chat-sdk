import React from 'react';
import { format } from 'date-fns';

import { Message } from 'components';

import { Container, FollowedMessage, MessageItem } from './styles';
import { ProfileImage } from 'components/ProfileImage';
import { IListMessages } from './types';

const ListMessages: React.FC<IListMessages> = (props) => {
  const { messages } = props;

  console.log(messages);

  return (
    <Container>
      {messages.length > 0 &&
        messages.map((message) => (
          <MessageItem key={message.key}>
            <MessageItem.Info>
              <p>{message.sender?.name}</p>
              <span>{format(message.createdAt ?? new Date(), 'MMM d, yyyy p')}</span>
            </MessageItem.Info>
            <MessageItem.Content>
              <ProfileImage imageUrl={message.sender?.photoURL || ''}></ProfileImage>
              <Message>{message.message?.text}</Message>
            </MessageItem.Content>
          </MessageItem>
        ))}
      {/* <MessageItem owner>
        <MessageItem.Info>
          <p>Larissa Dornelas</p>
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
      </MessageItem> */}
    </Container>
  );
};

export { ListMessages };
