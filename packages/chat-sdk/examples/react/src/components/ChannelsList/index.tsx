import React, { memo, useContext } from 'react';
import { IChannelsList } from './types';

import { Container, ChannelOption } from './styles';
import { ChatContext } from 'contexts/chatContext/chatContext';

const ChannelsListComponent: React.FC<IChannelsList> = (props) => {
  const { toggleChannel } = props;

  const { currentChannel, channels } = useContext(ChatContext);

  return (
    <Container>
      {channels &&
        channels.map((channel) => (
          <ChannelOption
            key={channel._id}
            active={currentChannel?.channel._id === channel._id}
            onClick={() => toggleChannel(channel._id)}
          >
            # {channel.name}
          </ChannelOption>
        ))}
    </Container>
  );
};

const ChannelsList = memo(ChannelsListComponent);

export { ChannelsList };
