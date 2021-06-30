import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const QuestionItem = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
  padding: 40px 20px;
  border-bottom: 1px solid ${theme.colors.lightGrey};
  min-height: 120px;
  justify-content: center;
`;

const ProfileArea: any = styled.div`
  display: flex;
`;
ProfileArea.SenderInfo = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-direction: column;
  margin-left: 10px;

  p {
    font-size: 0.8em;
    margin: 0 0 4px 0;
    font-weight: bold;
    color: ${theme.colors.darkBlue};
  }
  span {
    font-size: 0.7em;
    color: ${theme.colors.mediumGrey};
  }
`;

const QuestionArea: any = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 12px;
`;

QuestionArea.Tag = styled.span`
  background: ${theme.colors.qnaColor};
  color: white;
  padding: 5px;
  font-size: 0.7em;
  border-radius: 3px;
  top: 0px;
  z-index: 9;
`;

QuestionArea.Text = styled.div`
  background: ${theme.colors.lightBlue};
  padding: 20px 10px;
  margin-top: -5px;
`;
QuestionArea.Answer = styled.div<{ answered?: boolean }>`
  padding: 10px 8px;
  font-size: ${({ answered }) => (answered ? '0.9em' : '0.7em')};
  color: ${({ answered }) => (answered ? theme.colors.darkBlue : theme.colors.darkGrey)};
  font-weight: ${({ answered }) => (answered ? 'bold' : 'normal')};
  font-style: ${({ answered }) => (answered ? 'normal' : 'italic')};
`;

export { Container, ProfileArea, QuestionArea, QuestionItem };
