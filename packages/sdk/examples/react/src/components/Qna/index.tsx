import React, { useContext, useMemo } from 'react';
import { format } from 'date-fns';

import { Container, ProfileArea, QuestionArea, QuestionItem } from './styles';
import { ChatContext } from 'contexts/chatContext/chatContext';
import { ProfileImage } from 'components';

const Qna: React.FC = () => {
  const { questions } = useContext(ChatContext);

  const formatedData = (timestamp: number) => {
    return format(timestamp ?? new Date(), 'MMM d, yyyy p');
  };

  const qnaMap = useMemo(
    () =>
      questions?.map((question) => (
        <QuestionItem key={question.key}>
          <ProfileArea>
            <ProfileImage imageUrl={question.sender?.image ?? ''} />
            <ProfileArea.SenderInfo>
              <p>{question.sender.name}</p>
              <span>{formatedData(question.createdAt)}</span>
            </ProfileArea.SenderInfo>
          </ProfileArea>
          <QuestionArea>
            <QuestionArea.Tag>Question</QuestionArea.Tag>
            <QuestionArea.Text>{question.text}</QuestionArea.Text>
            <QuestionArea.Answer answered={question.answer}>
              {question.answer ? <> A: {question.answer?.text ?? ''} </> : <>Question not answered</>}
            </QuestionArea.Answer>
          </QuestionArea>
        </QuestionItem>
      )),
    [questions],
  );

  return <Container>{qnaMap}</Container>;
};

export { Qna };
