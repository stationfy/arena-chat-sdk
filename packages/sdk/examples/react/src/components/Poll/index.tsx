import React, { useCallback, useContext, useMemo, useState } from 'react';
import { IPoll } from './types';

import { Container } from './styles';
import { ChatContext } from 'contexts/chatContext/chatContext';

const Poll: React.FC<IPoll> = (props) => {
  const { poll } = props;
  const [warningActive, setWarningActive] = useState<boolean>(false);
  const { user, polls } = useContext(ChatContext);

  const handleVote = useCallback(
    async (index: number) => {
      console.log('index', index);
      if (user) {
        await polls?.pollVote(poll._id, index);
      } else {
        setWarningActive(true);
        setTimeout(() => {
          setWarningActive(false);
        }, 1000);
      }
    },
    [poll._id, polls, user],
  );

  const answersMap = useMemo(
    () =>
      poll.options.map((option, index) => (
        <Container.AnswerOption key={`${index}-${option.name}`} onClick={() => handleVote(index)}>
          {option.name}
        </Container.AnswerOption>
      )),
    [poll, handleVote],
  );

  return (
    <Container>
      <Container.Tag>Poll</Container.Tag>
      {!user && <Container.Warning active={warningActive}> Sign in to vote</Container.Warning>}
      <Container.Question>{poll.question}</Container.Question>
      <Container.Answers>{answersMap}</Container.Answers>
    </Container>
  );
};

export { Poll };
