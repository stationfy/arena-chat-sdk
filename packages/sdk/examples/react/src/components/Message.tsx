import React, { useMemo, memo } from 'react';
import { ChatMessage, ExternalUser, MessageReaction } from '@arena-im/chat-types';
import { Channel } from '../../../../dist/channel/channel';

interface Props {
  message: ChatMessage;
  currentUser: ExternalUser | null;
  currentChannel: Channel | null;
  setError: any;
}

function Message({ message, currentUser, currentChannel, setError }: Props) {
  const isCurrentUser = useMemo(() => {
    if (currentUser === null) {
      return false;
    }

    return currentUser.id === message.sender.uid;
  }, [message, currentUser]);

  const likes = useMemo(() => {
    return message.reactions?.love || 0;
  }, [message]);

  const userReacted = useMemo(() => {
    return message.currentUserReactions?.love ?? false;
  }, [message]);

  const likeImage = useMemo(() => {
    if (userReacted) {
      return '/heart-user.png';
    }

    if (likes > 0) {
      return './heart-others.png';
    }

    return './heart.png';
  }, [likes, userReacted]);

  function getTimestamp() {
    const date = message.createdAt ? new Date(message.createdAt) : new Date();
    const hours = date.getHours();
    const minutes = date.getMinutes();

    return `${hours}:${minutes}`;
  }

  function like() {
    if (currentUser === null) {
      setError('Cannot react to a message without an user');
      return setTimeout(() => {
        setError(null);
      }, 2000);
    }

    if (typeof message.key === 'undefined') {
      return;
    }

    const reaction: MessageReaction = {
      type: 'love',
      messageID: message.key,
    };

    try {
      currentChannel?.sendReaction(reaction);
    } catch (e) {
      setError(e.message);
    }
  }

  function handleDeleteMessage() {
    currentChannel?.deleteMessage(message);
  }

  function handleBanUser() {
    currentChannel?.banUser(message.sender);
  }

  return (
    <div className={`message new${isCurrentUser ? ' message-personal' : ''}`}>
      {!isCurrentUser && (
        <figure className="avatar">
          <img src={message.sender.photoURL} alt="avatar" />
        </figure>
      )}
      <div className="message-text">{message.message.text}</div>
      <div className="message-heart-container">
        <img src={likeImage} alt="love" className="message-heart" onClick={like} />
        {likes}
        {currentUser?.isModerator && (
          <>
            <span role="img" aria-label="delete" className="message-moderator-button" onClick={handleDeleteMessage}>
              ❌Delete
            </span>
            {!isCurrentUser && (
              <span role="img" aria-label="ban" className="message-moderator-button" onClick={handleBanUser}>
                BanUser
              </span>
            )}
          </>
        )}
      </div>
      <div className="timestamp">
        <div>{getTimestamp()}</div>
        <div>{' | '}</div>
        <div>{isCurrentUser ? '' : message.sender.displayName}</div>
      </div>
    </div>
  );
}

export default memo(Message);
