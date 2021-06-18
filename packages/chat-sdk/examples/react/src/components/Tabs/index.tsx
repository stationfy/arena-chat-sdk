import React, { memo, useContext } from 'react';

import { ChatContext } from 'contexts/chatContext/chatContext';
import { Container, TabItem } from './styles';
import { CurrentTabIndex, ITabs } from './types';

const TabsComponent: React.FC<ITabs> = (props) => {
  const { currentTabIndex, toggleTab } = props;

  const { currentChannel } = useContext(ChatContext);

  return (
    <Container role="tablist">
      <TabItem
        role="tab"
        selected={currentTabIndex === CurrentTabIndex.CHAT}
        onClick={() => toggleTab(CurrentTabIndex.CHAT)}
      >
        {currentChannel?.channel.name ?? 'Chat'}
      </TabItem>
      <TabItem
        role="tab"
        selected={currentTabIndex === CurrentTabIndex.CHANNELS}
        onClick={() => toggleTab(CurrentTabIndex.CHANNELS)}
      >
        Channels
      </TabItem>
      <TabItem
        role="tab"
        selected={currentTabIndex === CurrentTabIndex.POLLS}
        onClick={() => toggleTab(CurrentTabIndex.POLLS)}
      >
        Polls
      </TabItem>
      <TabItem
        role="tab"
        selected={currentTabIndex === CurrentTabIndex.QNA}
        onClick={() => toggleTab(CurrentTabIndex.QNA)}
      >
        Q&A
      </TabItem>
    </Container>
  );
};

const Tabs = memo(TabsComponent);

export { Tabs };
