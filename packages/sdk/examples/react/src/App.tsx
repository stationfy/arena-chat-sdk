import React from 'react';
import { Home } from './Pages/Home';
import { GlobalStyle } from './stylesheets/global';

// import { Container } from './styles';

const App: React.FC = () => {
  return (
    <>
      <GlobalStyle />
      <Home />
    </>
  );
};

export default App;
