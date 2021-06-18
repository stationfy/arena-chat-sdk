import React from 'react';

import { Container } from './styles';
import { IQnaChat } from './types';

const QnaChat: React.FC<IQnaChat> = (props) => {
  const { qna, seeAllButton } = props;

  return (
    <Container>
      <Container.Tag>Q&A</Container.Tag>
      <Container.Question>{qna.text}</Container.Question>
      <Container.Answer>
        <strong>A:</strong> {qna.answer.text}
      </Container.Answer>

      <Container.SeeAll onClick={seeAllButton}>{'See all questions >>'}</Container.SeeAll>
    </Container>
  );
};

export { QnaChat };
