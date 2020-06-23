import React from 'react';
import { ChatMessage } from '../../dist/src/models/chat-message';

interface Message {
  message: ChatMessage;
}
function Message({ message }: Message) {
  function getTimestamp() {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours}:${minutes}`;
  }

  return (
    <div className="message new">
      <figure className="avatar">
        <img src={message.sender.photoURL} />
      </figure>
      {message.message.text}
      <div className="timestamp">
        {getTimestamp()} | {message.sender.displayName}
      </div>
    </div>
  );
}

export default Message;
