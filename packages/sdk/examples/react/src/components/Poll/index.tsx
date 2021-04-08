import { PollChat } from 'components/PollChat';
import { ChatContext } from 'contexts/chatContext/chatContext';
import React, { useContext, useMemo } from 'react';

import { Container } from './styles';

const Poll: React.FC = () => {
  const { pollsList } = useContext(ChatContext);

  const formatedPolls = useMemo(() => {
    return pollsList?.map((poll) => ({ ...poll, options: Object.values(poll.options) }));
  }, [pollsList]);

  const pollsMap = useMemo(() => pollsList && formatedPolls?.map((poll) => <PollChat key={poll._id} poll={poll} />), [
    pollsList,
    formatedPolls,
  ]);

  return <Container>{pollsMap}</Container>;
};

export { Poll };
