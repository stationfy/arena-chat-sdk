import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { Message, Loader, QnaChat as Qna } from 'components';
// import { PollChat as Poll} from 'components';

import { Container, LoadingArea, LoadPreviousObservable, ScrollObservable } from './styles';
import { IListMessages, MessageType } from './types';
import { ChatContext } from 'contexts/chatContext/chatContext';

const ListMessages: React.FC<IListMessages> = (props) => {
  const { messages, seeAllQna } = props;
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
          // return <Poll key={message.key} poll={message.poll} seeAllButton={seeAllPoll} />;
          return null;
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
      const options = {
        root: null,
        rootMargin: '0px',
        threshold: 1.0,
      };

      const observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) {
          handleLoadPrevMessages(5);

          if (!allMessagesLoaded && !loadingPreviousMessages) {
            setWatchMessagesScroll(false);
            scrollMiddleRef.current?.scroll({ top: 90, behavior: 'smooth' });
          }
        }
      }, options);

      if (loadPreviousRef && loadPreviousRef.current) {
        observer.observe(loadPreviousRef.current);
      }
      if (loadingPreviousMessages) {
        observer.disconnect();
      }

      return () => observer.disconnect();
    }
  }, [loadPreviousRef, messages, handleLoadPrevMessages, loadingPreviousMessages, allMessagesLoaded]);

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
