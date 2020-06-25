import React, { useMemo } from 'react';
import { ChatMessage } from '../../../dist/models/chat-message';
import { ExternalUser } from '../../../dist/models/user';

interface Props {
  message: ChatMessage;
  currentUser: ExternalUser | null;
}

function Message({ message, currentUser }: Props) {
  const isCurrentUser = useMemo(() => {
    if (currentUser === null) {
      return false;
    }

    return currentUser.id === message.sender.uid;
  }, [message, currentUser]);

  function getTimestamp() {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours}:${minutes}`;
  }

  return (
    <div className={`message new${isCurrentUser ? ' message-personal' : ''}`}>
      {!isCurrentUser && (
        <figure className="avatar">
          <img src={message.sender.photoURL} alt="avatar" />
        </figure>
      )}
      {message.message.text}
      <div className="timestamp">
        {getTimestamp()} | {isCurrentUser ? '' : message.sender.displayName}
      </div>
    </div>
  );
}

export default Message;
