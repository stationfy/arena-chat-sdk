import React, { useContext, useMemo } from 'react';
import { IChannelsList } from './types';

import { Container, ChannelOption } from './styles';
import { ChatContext } from 'contexts/chatContext/chatContext';

const ChannelsList: React.FC<IChannelsList> = (props) => {
  const { toggleChannel } = props;

  const { currentChannel, channels } = useContext(ChatContext);

  const channelsMap = useMemo(
    () =>
      channels &&
      channels.map((channel) => (
        <ChannelOption
          key={channel._id}
          active={currentChannel?.channel._id === channel._id}
          onClick={() => toggleChannel(channel._id)}
        >
          # {channel.name}
        </ChannelOption>
      )),
    [channels, currentChannel, toggleChannel],
  );

  return <Container>{channelsMap}</Container>;
};

export { ChannelsList };
