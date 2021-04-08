import React, { useCallback, useContext, useState } from 'react';
import { IPoll } from './types';

import { Container } from './styles';
import { ChatContext } from 'contexts/chatContext/chatContext';

const PollChat: React.FC<IPoll> = (props) => {
  const { poll, seeAllButton } = props;
  const [warningActive, setWarningActive] = useState<boolean>(false);
  const { user, pollsI } = useContext(ChatContext);

  const handleVote = useCallback(
    async (index: number) => {
      if (user) {
        await pollsI?.pollVote(poll._id, index);
      } else {
        setWarningActive(true);
        setTimeout(() => {
          setWarningActive(false);
        }, 1000);
      }
    },
    [poll._id, pollsI, user],
  );

  // const answersMap = useMemo(() => {
  //   if (poll.options) {
  //     return poll.options.map((option, index) => (
  //       <Container.AnswerOption key={`${index}-${option.name}`} onClick={() => handleVote(index)}>
  //         {option.name}
  //       </Container.AnswerOption>
  //     ));
  //   }
  // }, [poll, handleVote]);

  return (
    <Container>
      <Container.Tag>Poll</Container.Tag>
      {!user && <Container.Warning active={warningActive}> Sign in to vote</Container.Warning>}
      <Container.Question>{poll.question}</Container.Question>
      {/* <Container.Answers>{answersMap}</Container.Answers> */}
      {seeAllButton && <Container.SeeAll onClick={seeAllButton}>{'See all polls >>'}</Container.SeeAll>}
    </Container>
  );
};

export { PollChat };
