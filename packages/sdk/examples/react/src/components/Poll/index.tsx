import { PollChat } from 'components/PollChat';
import { ChatContext } from 'contexts/chatContext/chatContext';
import React, { useContext, useMemo } from 'react';

import { Container } from './styles';

const Poll: React.FC = () => {
  const { pollsList } = useContext(ChatContext);

  const pollsMap = useMemo(() => pollsList && pollsList?.map((poll) => <PollChat poll={poll} />), [pollsList]);

  return <Container>{pollsMap}</Container>;
};

export { Poll };
