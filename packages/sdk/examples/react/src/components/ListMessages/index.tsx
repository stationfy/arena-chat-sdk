import React, { memo, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { format } from 'date-fns';
import { ChatMessage } from '@arena-im/chat-types';

import { Message } from 'components';

import { Container, LoadingArea, LoadPreviousObservable, MessageItem, ScrollObservable } from './styles';
import { ProfileImage } from 'components/ProfileImage';
import { IListMessages } from './types';
import { ChatContext } from 'contexts/chatContext/chatContext';
import { Loader } from 'components/Loader';

const ListMessagesComponent: React.FC<IListMessages> = (props) => {
  const { messages } = props;
  const { user, handleLoadPrevMessages, loadingMessages, allMessagesLoaded } = useContext(ChatContext);

  const [watchMessagesScroll, setWatchMessagesScroll] = useState(true);

  console.log(user);
  console.log(messages);

  const isOwner = (message: ChatMessage) => {
    if (user?.id) {
      return user.id === message.sender?.uid;
    }
  };

  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const scrollMiddleRef = useRef<HTMLDivElement>(null);
  const loadPreviousRef = useRef<HTMLDivElement>(null);

  const activeWatchMessagesScroll = useCallback((entries) => {
    const target = entries[0];

    if (target.isIntersecting) {
      setWatchMessagesScroll(true);
    } else {
      setWatchMessagesScroll(false);
    }
  }, []);

  const loadPrevious = useCallback(
    (entries) => {
      const target = entries[0];

      if (target.isIntersecting) {
        handleLoadPrevMessages(5);
        if (!allMessagesLoaded) scrollMiddleRef.current?.scrollIntoView({ behavior: 'auto' });
      }
    },
    [handleLoadPrevMessages, allMessagesLoaded],
  );

  useEffect(() => {
    if (messages.length > 0 && watchMessagesScroll) {
      scrollBottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, user, watchMessagesScroll]);

  useEffect(() => {
    const observer = new IntersectionObserver(activeWatchMessagesScroll);

    if (scrollBottomRef && scrollBottomRef.current) {
      observer.observe(scrollBottomRef.current);
    }
  });

  useEffect(() => {
    const observer = new IntersectionObserver(loadPrevious);

    if (loadPreviousRef && loadPreviousRef.current) {
      observer.observe(loadPreviousRef.current);
    }
  }, [loadPreviousRef, loadPrevious]);

  return (
    <Container>
      {messages.length > 0 && (
        <>
          {loadingMessages ? (
            <LoadingArea>
              <Loader />
            </LoadingArea>
          ) : (
            <LoadPreviousObservable ref={loadPreviousRef} style={{ height: 10 }}></LoadPreviousObservable>
          )}
          {messages.map((message, index) => {
            return (
              <MessageItem key={message.key} owner={isOwner(message)} ref={index === 1 ? scrollMiddleRef : null}>
                <MessageItem.Info>
                  <p>{message.sender?.displayName}</p>
                  <span>{format(message.createdAt ?? new Date(), 'MMM d, yyyy p')}</span>
                </MessageItem.Info>
                <MessageItem.Content>
                  {!isOwner(message) && <ProfileImage imageUrl={message.sender?.photoURL || ''}></ProfileImage>}
                  <Message owner={isOwner(message)}>{message.message?.text}</Message>
                </MessageItem.Content>
              </MessageItem>
            );
          })}
        </>
      )}
      <ScrollObservable ref={scrollBottomRef}></ScrollObservable>
    </Container>
  );
};

const ListMessages = memo(ListMessagesComponent);

export { ListMessages };
