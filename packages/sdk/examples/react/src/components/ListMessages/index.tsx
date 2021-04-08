import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { Message, Loader, PollChat as Poll, QnaChat as Qna } from 'components';

import { Container, LoadingArea, LoadPreviousObservable, ScrollObservable } from './styles';
import { IListMessages, MessageType } from './types';
import { ChatContext } from 'contexts/chatContext/chatContext';

const ListMessages: React.FC<IListMessages> = (props) => {
  const { messages, seeAllPoll, seeAllQna } = props;
  const {
    user,
    handleLoadPrevMessages,
    loadingPreviousMessages,
    allMessagesLoaded,
    loadingChannelMessages,
  } = useContext(ChatContext);

  const [watchMessagesScroll, setWatchMessagesScroll] = useState(true);

  const scrollBottomRef = useRef<HTMLDivElement>(null);
  const scrollMiddleRef = useRef<HTMLDivElement>(null);
  const loadPreviousRef = useRef<HTMLDivElement>(null);

  const renderMessage = (message: any) => {
    if (message) {
      switch (message.type) {
        case MessageType.POLL:
          return <Poll key={message.key} poll={message.poll} seeAllButton={seeAllPoll} />;

        case MessageType.QNA:
          return <Qna key={message.key} qna={message.question} seeAllButton={seeAllQna} />;

        default:
          return <Message key={message.key} message={message} />;
      }
    }
  };

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
        if (!allMessagesLoaded && !loadingPreviousMessages) {
          setWatchMessagesScroll(false);
          scrollMiddleRef.current?.scrollTo({ top: 80, behavior: 'smooth' });
        }
      }
    },
    [handleLoadPrevMessages, allMessagesLoaded, loadingPreviousMessages],
  );

  useEffect(() => {
    if (messages.length > 0 && watchMessagesScroll) {
      scrollBottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, user, watchMessagesScroll, loadingChannelMessages]);

  useEffect(() => {
    const observer = new IntersectionObserver(activeWatchMessagesScroll);

    if (scrollBottomRef && scrollBottomRef.current) {
      observer.observe(scrollBottomRef.current);
    }
  }, [activeWatchMessagesScroll]);

  useEffect(() => {
    if (messages.length > 0) {
      const observer = new IntersectionObserver(loadPrevious);

      if (loadPreviousRef && loadPreviousRef.current) {
        observer.observe(loadPreviousRef.current);
      }
    }
  }, [loadPreviousRef, loadPrevious, messages]);

  return (
    <Container ref={scrollMiddleRef}>
      {messages.length > 0 && (
        <>
          {!loadingPreviousMessages ? (
            <LoadPreviousObservable ref={loadPreviousRef}></LoadPreviousObservable>
          ) : (
            <LoadingArea>
              <Loader />
            </LoadingArea>
          )}
          {messages.map((message: any) => renderMessage(message))}
        </>
      )}
      <ScrollObservable ref={scrollBottomRef}></ScrollObservable>
    </Container>
  );
};

export { ListMessages };
