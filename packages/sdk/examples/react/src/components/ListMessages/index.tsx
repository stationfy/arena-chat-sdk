import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Message } from 'components';

import { Container, LoadingArea, LoadPreviousObservable, ScrollObservable } from './styles';
import { IListMessages, MessageType } from './types';
import { ChatContext } from 'contexts/chatContext/chatContext';
import { Loader } from 'components/Loader';
import { Poll } from 'components/Poll';

const ListMessages: React.FC<IListMessages> = (props) => {
  const { messages } = props;
  const { user, handleLoadPrevMessages, loadingMessages, allMessagesLoaded } = useContext(ChatContext);
  console.log(messages);
  const [watchMessagesScroll, setWatchMessagesScroll] = useState(true);

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
        if (!allMessagesLoaded && !loadingMessages) {
          setWatchMessagesScroll(false);
          scrollMiddleRef.current?.scrollTo({ top: 80, behavior: 'smooth' });
        }
      }
    },
    [handleLoadPrevMessages, allMessagesLoaded, loadingMessages],
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
    <Container ref={scrollMiddleRef}>
      {messages.length > 0 && (
        <>
          {!loadingMessages ? (
            <LoadPreviousObservable ref={loadPreviousRef}></LoadPreviousObservable>
          ) : (
            <LoadingArea>
              <Loader />
            </LoadingArea>
          )}
          {messages.map((message: any) => {
            return message.type === MessageType.POLL ? (
              <Poll key={message.key} poll={message.poll} />
            ) : (
              <Message key={message.key} message={message} />
            );
          })}
        </>
      )}
      <ScrollObservable ref={scrollBottomRef}></ScrollObservable>
    </Container>
  );
};

export { ListMessages };
