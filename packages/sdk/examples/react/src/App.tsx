import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import ArenaChat from '@arena-im/chat-sdk';
import { ExternalUser, ChatMessage } from '@arena-im/chat-types';
import './App.css';
import Message from './components/Message';
import { Channel } from '../../../dist/channel/channel';

function App() {
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState('');
  const [error, setError] = useState(null);
  const [fetchingPrevious, setFetchingPrevious] = useState(false);
  const [user, setUser] = useState<ExternalUser | null>(null);
  const [loginWait, setLoginWait] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const preventFetchPrevious = useRef(false);
  const previousScrollHeight = useRef(0);
  const channel = useRef<Channel | null>(null);
  const arenaChat = useRef<ArenaChat | null>(null);

  const newMessagesCallback = useCallback((message: ChatMessage) => {
    setMessages((messages) => [...messages, message]);
  }, []);

  const delededMessagesCallback = useCallback((message: ChatMessage) => {
    setMessages((messages) => messages.filter((item) => item.key !== message.key));
  }, []);

  const modifiedMessagesCallback = useCallback((modifiedMessage: ChatMessage) => {
    console.log({ modifiedMessage });
    setMessages((messages) => {
      return messages.map((message) => {
        if (message.key === modifiedMessage.key) {
          return modifiedMessage;
        }

        return message;
      });
    });
  }, []);

  useEffect(() => {
    async function initializeChat() {
      try {
        arenaChat.current = new ArenaChat(YOUR_SITE_SLUG);

        channel.current = await arenaChat.current.getChannel(YOUR_CHAT_SLUG);

        const messages = await channel.current.loadRecentMessages(20);

        setMessages(messages);

        channel.current.onMessageReceived(newMessagesCallback);

        channel.current.onMessageDeleted(delededMessagesCallback);

        channel.current.onMessageModified(modifiedMessagesCallback);
      } catch (e) {
        setError(e.message);
      }
    }

    initializeChat();
  }, []);

  useEffect(() => {
    if (preventFetchPrevious.current) {
      setFetchingPrevious(false);
      preventFetchPrevious.current = false;

      if (containerRef.current !== null) {
        const currentScrollHeight = containerRef.current.scrollHeight || 0;

        containerRef.current.scrollTop = currentScrollHeight - previousScrollHeight.current;
      }
    } else {
      scrollDown();
    }
  }, [messages]);

  useEffect(() => {
    containerRef.current?.addEventListener('scroll', async () => {
      if (containerRef.current?.scrollTop === 0 && !preventFetchPrevious.current && channel.current !== null) {
        setFetchingPrevious(true);
        preventFetchPrevious.current = true;

        previousScrollHeight.current = containerRef.current.scrollHeight;

        const nextMessages = await channel.current.loadPreviousMessages(5);

        setMessages((messages) => [...nextMessages, ...messages]);
      }
    });
  }, []);

  async function handleSendMessage() {
    if (sending || !channel.current) {
      return;
    }

    setSending(true);

    try {
      await channel.current.sendMessage(text);
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

  async function handleLogin() {
    if (loginWait || !arenaChat.current) {
      return;
    }

    setLoginWait(true);

    const user = {
      image: 'https://randomuser.me/api/portraits/women/56.jpg',
      name: 'Naomi Carter',
      id: 'tornado',
      email: 'naomi.carter@example.com',
    };

    const result = await arenaChat.current.setUser(user);

    setLoginWait(false);

    setUser(result);
  }

  function stopChatting() {
    channel.current?.offMessageDeleted();
    setUser(null);
  }

  async function requestModeration() {
    const moderation = await channel.current?.requestModeration();

    console.log(moderation);
  }

  const isModerator = useMemo(() => {
    return user && user.isModerator;
  }, [user]);

  return (
    <div className="App">
      {user && !isModerator && <button onClick={requestModeration}>Request Moderation</button>}
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
          {user !== null && (
            <button className="stop-chatting-button" onClick={stopChatting}>
              Stop Chatting
            </button>
          )}
        </div>
        <div className="messages">
          <div ref={containerRef} className="messages-content mCustomScrollbar _mCS_1">
            {fetchingPrevious && <div>Loading...</div>}
            {messages.map((message) => (
              <Message
                key={message.key}
                message={message}
                currentUser={user}
                currentChannel={channel.current}
                setError={setError}
              />
            ))}
          </div>
        </div>
        <div className="message-box">
          {user === null ? (
            <button
              className="login-button"
              onClick={handleLogin}
              style={loginWait ? { background: 'gray', cursor: 'wait' } : {}}
            >
              {loginWait ? 'Loading...' : 'Login'}
            </button>
          ) : (
            <>
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
            </>
          )}
        </div>
      </div>
      <div className="bg"></div>
    </div>
  );
}

export default App;
