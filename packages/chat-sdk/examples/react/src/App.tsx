import React from 'react';
import { Home } from './Pages/Home';
import { GlobalStyle } from './stylesheets/global';
import { ChatContextProvider } from 'contexts/chatContext/chatContext';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <ChatContextProvider>
        <Home />
      </ChatContextProvider>
    </>
  );
};

export default App;
