import React, { memo, useContext, useMemo } from 'react';
import { PollChat } from 'components/PollChat';
import { ChatContext } from 'contexts/chatContext/chatContext';

import { Container } from './styles';

const PollComponent: React.FC = () => {
  const { pollsList } = useContext(ChatContext);

  const formatedPolls = useMemo(() => {
    return pollsList?.map((poll) => ({ ...poll, options: Object.values(poll.options) }));
  }, [pollsList]);

  return <Container>{pollsList && formatedPolls?.map((poll) => <PollChat key={poll._id} poll={poll} />)}</Container>;
};

const Poll = memo(PollComponent);

export { Poll };
