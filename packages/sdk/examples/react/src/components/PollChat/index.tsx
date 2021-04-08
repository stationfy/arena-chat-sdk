import React, { useCallback, useContext, useMemo, useState } from 'react';
import { IPoll } from './types';

import { Container } from './styles';
import { ChatContext } from 'contexts/chatContext/chatContext';

const PollChat: React.FC<IPoll> = (props) => {
  const { poll, seeAllButton } = props;
  const [warningActive, setWarningActive] = useState<boolean>(false);
  const { user, pollsI } = useContext(ChatContext);

  const calcPercentage = useMemo(() => {
    const totalVotes = poll.options.reduce((prev, curr) => {
      return (prev += curr.total);
    }, 0);

    return totalVotes === 0 ? 1 : totalVotes;
  }, [poll]);

  const handleVote = useCallback(
    async (index: number) => {
      if (user && !poll.currentUserVote) {
        await pollsI?.pollVote(poll._id, index);
      } else {
        setWarningActive(true);
        setTimeout(() => {
          setWarningActive(false);
        }, 1000);
      }
    },
    [poll._id, pollsI, user, poll.currentUserVote],
  );

  const answersMap = useMemo(() => {
    if (poll.options.length > 0) {
      return poll.options.map((option, index) => (
        <Container.AnswerOption
          key={`${index}-${option.name}-${poll._id}`}
          onClick={() => handleVote(index)}
          voted={poll.currentUserVote !== undefined}
          votedOption={poll.currentUserVote === index}
        >
          <>{option.name}</>
          {poll.currentUserVote !== undefined && <span>{(option.total / calcPercentage) * 100}%</span>}
        </Container.AnswerOption>
      ));
    }
  }, [poll, handleVote, calcPercentage]);

  return (
    <Container>
      <Container.Tag>Poll</Container.Tag>
      {!user && <Container.Warning active={warningActive}> Sign in to vote</Container.Warning>}
      <Container.Question>{poll.question}</Container.Question>
      <Container.Answers>{answersMap}</Container.Answers>
      {seeAllButton && <Container.SeeAll onClick={seeAllButton}>{'See all polls >>'}</Container.SeeAll>}
    </Container>
  );
};

export { PollChat };
