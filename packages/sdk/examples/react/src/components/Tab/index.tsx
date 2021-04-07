import React from 'react';

// import { ITab, ITabItem } from "./types";
import { Container, TabItem } from './styles';

const Tab: React.FC = (props) => {
  return (
    <Container>
      <TabItem selected>Chat</TabItem>
      <TabItem>Channels</TabItem>
      <TabItem>Polls</TabItem>
      <TabItem>Q&A</TabItem>
    </Container>
  );
};

export { Tab };
