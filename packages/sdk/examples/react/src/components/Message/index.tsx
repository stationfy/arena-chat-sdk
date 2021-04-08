import React, { memo, useCallback, useContext, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { MessageReaction } from '@arena-im/chat-types';

import { ChatContext } from 'contexts/chatContext/chatContext';
import { IMessage } from './types';
import { MessageItem } from './styles';
import { ProfileImage } from 'components/';
import { ActionButton } from 'components/ActionButton';
import { blockUser, deleteMessage } from 'assets/icons';

const MessageComponent: React.FC<IMessage> = (props) => {
  const { message } = props;

  const reactionType = 'like';

  const currentUserReacted = useMemo(() => {
    if (message.currentUserReactions) {
      return message.currentUserReactions[reactionType];
    } else return false;
  }, [message]);

  const { user, currentChannel } = useContext(ChatContext);

  const [showReactionButton, setShowReactioButton] = useState(currentUserReacted);
  const [userHasReacted, setUserHasReacted] = useState(currentUserReacted);

  const handleShowReactionButton = useCallback(() => {
    setShowReactioButton(true);
  }, []);

  const handleHideReactionButton = useCallback(() => {
    if (!userHasReacted) setShowReactioButton(false);
  }, [userHasReacted]);

  const handleReaction = useCallback(async () => {
    if (user) {
      const reaction: MessageReaction = {
        type: reactionType,
        messageID: message.key ?? '',
      };

      if (userHasReacted) {
        currentChannel?.deleteReaction(reaction);
        setUserHasReacted(false);
      } else {
        currentChannel?.sendReaction(reaction);

        setUserHasReacted(true);
        setShowReactioButton(true);
      }
    }
  }, [currentChannel, message.key, user, userHasReacted]);

  const handleBanUser = useCallback(() => {
    if (message.sender) {
      currentChannel?.banUser(message?.sender);
    }
  }, [currentChannel, message]);

  const handleDeleteMessage = useCallback(() => {
    currentChannel?.deleteMessage(message);
  }, [message, currentChannel]);

  const isOwner = useMemo(() => {
    if (user?.id) {
      return user.id === message.sender?.uid;
    }
    return false;
  }, [user, message]);

  const showButton = useMemo(() => {
    return showReactionButton && !isOwner && user;
  }, [showReactionButton, isOwner, user]);

  const formatedData = useMemo(() => {
    return format(message.createdAt ?? new Date(), 'MMM d, yyyy p');
  }, [message]);

  return (
    <MessageItem owner={isOwner}>
      {!isOwner && message?.sender?.label === 'Mod' && <MessageItem.ModeratorTag>mod</MessageItem.ModeratorTag>}
      <MessageItem.Info>
        <p>{message.sender?.displayName} </p>
        <span>{formatedData}</span>
        {!isOwner && user?.isModerator && (
          <MessageItem.ModeratorActions>
            <ActionButton iconUrl={blockUser} onClick={handleBanUser} size={15} title={'Ban User'} />
            <ActionButton
              iconUrl={deleteMessage}
              onClick={handleDeleteMessage}
              size={15}
              style={{ marginLeft: 5 }}
              title={'Delete Message'}
            />
          </MessageItem.ModeratorActions>
        )}
      </MessageItem.Info>
      <MessageItem.Content>
        {!isOwner && <ProfileImage imageUrl={message.sender?.photoURL || ''}></ProfileImage>}
        <MessageItem.Text
          owner={isOwner}
          onMouseEnter={handleShowReactionButton}
          onMouseLeave={handleHideReactionButton}
        >
          {message.message?.text || ''}

          {showButton && <MessageItem.Reaction filled={userHasReacted} onClick={handleReaction} />}
        </MessageItem.Text>
      </MessageItem.Content>
    </MessageItem>
  );
};

const Message = memo(MessageComponent);

export { Message };
