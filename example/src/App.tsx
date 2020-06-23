import React, { useEffect, useState, useCallback, useRef } from 'react';
import './App.css';
import * as ArenaSDKAPI from './arena-sdk';
import { ChatMessage } from '../../dist/src/models/chat-message';
import Message from './Message';

function App() {
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [fetchingPrevious, setFetchingPrevious] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preventFetchPrevious = useRef(false);
  const previousScrollHeight = useRef(0);

  const newMessagesCallback = useCallback((message: ChatMessage) => {
    console.log({ message });
    if (message.changeType === 'added') {
      setMessages((messages) => [...messages, message]);
    }

    if (message.changeType === 'removed') {
      setMessages((messages) => messages.filter((item) => item.key !== message.key));
    }
  }, []);

  useEffect(() => {
    async function fetchMessages() {
      console.log('initialize');
      const messages = await ArenaSDKAPI.initialize(newMessagesCallback);

      setMessages(messages);
    }
    fetchMessages();
  }, [newMessagesCallback]);

  useEffect(() => {
    if (preventFetchPrevious.current) {
      setFetchingPrevious(false);
      preventFetchPrevious.current = false;

      if (containerRef.current !== null) {
        const currentScrollHeight = containerRef.current.scrollHeight || 0;

        console.log({ current: currentScrollHeight, previous: previousScrollHeight.current });

        containerRef.current.scrollTop = currentScrollHeight - previousScrollHeight.current;
      }
    } else {
      scrollDown();
    }
  }, [messages]);

  useEffect(() => {
    containerRef.current?.addEventListener('scroll', async () => {
      if (containerRef.current?.scrollTop === 0 && !preventFetchPrevious.current) {
        setFetchingPrevious(true);
        preventFetchPrevious.current = true;

        previousScrollHeight.current = containerRef.current.scrollHeight;

        const nextMessages = await ArenaSDKAPI.loadPrevious();

        console.log({ nextMessages });

        setMessages((messages) => [...nextMessages, ...messages]);
      }
    });
  }, []);

  async function handleSendMessage() {
    if (sending) {
      return;
    }

    setSending(true);

    try {
      await ArenaSDKAPI.sendMessage(text);
      setText('');
    } catch (e) {
      setError(e.message);
      console.error(e);
    } finally {
      setSending(false);
    }

    if (inputRef !== null && inputRef.current !== null) {
      inputRef.current.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    setError(null);
    if (e.keyCode === 13) {
      handleSendMessage();
    }
  }

  function scrollDown() {
    const container = document.querySelector('.messages-content');

    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }

  return (
    <div className="App">
      <div className="chat">
        <div className="chat-title">
          <div>
            <h1>Arena Chat</h1>
            <h2>Example</h2>
            <figure className="avatar">
              <img alt="avatar" src="https://sandbox.arena.im/public/icons/favicon-32x32-2.png" />
            </figure>
          </div>
          {error && <div className="chat-error">{error}</div>}
        </div>
        <div className="messages">
          <div ref={containerRef} className="messages-content mCustomScrollbar _mCS_1">
            {fetchingPrevious && <div>Loading...</div>}
            {messages.map((message) => (
              <Message key={message.key} message={message} />
            ))}
          </div>
        </div>
        <div className="message-box">
          <input
            ref={inputRef}
            type="text"
            className="message-input"
            placeholder="Type message..."
            onChange={(e) => setText(e.target.value)}
            value={text}
            onKeyDown={handleKeyDown}
            disabled={sending}
          ></input>
          <button type="submit" className="message-submit" onClick={handleSendMessage} disabled={sending}>
            {!sending ? 'Send' : 'Sending...'}
          </button>
        </div>
      </div>
      <div className="bg"></div>
    </div>
  );
}

export default App;
