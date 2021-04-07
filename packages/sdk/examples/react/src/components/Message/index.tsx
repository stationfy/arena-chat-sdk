import React, { memo, useContext, useMemo } from 'react';
import { format } from 'date-fns';
import { ChatContext } from 'contexts/chatContext/chatContext';
import { IMessage } from './types';
import { ProfileImage } from 'components/ProfileImage';
import { MessageItem } from './styles';

const MessageComponent: React.FC<IMessage> = (props) => {
  const { message } = props;

  const { user } = useContext(ChatContext);

  const isOwner = useMemo(() => {
    console.log('user', user);
    console.log('sender', message.sender);
    if (user?.id) {
      return user.id === message.sender?.uid;
    }
    return false;
  }, [user, message]);

  const formatedData = useMemo(() => {
    return format(message.createdAt ?? new Date(), 'MMM d, yyyy p');
  }, [message]);

  return (
    <MessageItem owner={isOwner}>
      <MessageItem.Info>
        <p>{message.sender?.displayName}</p>
        <span>{formatedData}</span>
      </MessageItem.Info>
      <MessageItem.Content>
        {!isOwner && <ProfileImage imageUrl={message.sender?.photoURL || ''}></ProfileImage>}
        <MessageItem.Text owner={isOwner}>{message.message?.text || ''}</MessageItem.Text>
      </MessageItem.Content>
    </MessageItem>
  );
};

const Message = memo(MessageComponent);

export { Message };
