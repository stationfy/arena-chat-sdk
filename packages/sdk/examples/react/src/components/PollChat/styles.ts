import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

const getBackroundHover = (voted: boolean, votedOption: boolean) => {
  if (voted && votedOption) {
    return theme.colors.lightGrey;
  } else if (voted) {
    return theme.colors.white;
  }
  return theme.colors.lightGrey;
};

const Container: any = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  padding: 10px 0;
  margin: 15px 0;
  background-color: ${theme.colors.white};
  box-shadow: -1px 1px 17px -4px ${theme.colors.mediumGrey};
`;

Container.Question = styled.h1`
  font-size: 1.3em;
  padding: 11px;
`;

Container.AnswerOption = styled.button<{ voted?: boolean; votedOption?: boolean }>`
  display: flex;
  justify-content: space-between;
  background-color: ${({ votedOption }) => (votedOption ? theme.colors.lightGrey : theme.colors.white)};
  color: ${theme.colors.black};
  padding: 8px;
  border: 1px solid ${theme.colors.lightGrey};
  margin: 5px 10px;
  cursor: ${({ voted }) => (voted ? 'default' : 'pointer')};

  &:hover {
    background-color: ${({ voted = false, votedOption = false }) => getBackroundHover(voted, votedOption)};
  }

  &:focus {
    outline: none;
  }

  span {
    color: ${theme.colors.darkGrey};
  }
`;

Container.Answers = styled.div`
  display: flex;
  flex-direction: column;
`;

Container.Tag = styled.span`
  margin-left: 10px;
  padding: 10px;
  background-color: ${theme.colors.pollColor};
  font-size: 0.9em;
  color: ${theme.colors.white};
`;

Container.Warning = styled.span<{ active?: boolean }>`
  font-size: ${({ active }) => (active ? '0.85em' : '0.8em')};
  padding: 10px;
  color: ${({ active }) => (active ? theme.colors.darkBlue : theme.colors.mediumGrey)};
  text-align: center;
`;

Container.SeeAll = styled.button`
  background: transparent;
  border: none;
  color: ${theme.colors.darkBlue};
  padding: 15px 0 0 0;
  font-size: 0.8em;
  cursor: pointer;

  &:hover {
    color: ${theme.colors.mediumBlue};
  }

  &:focus {
    outline: none;
  }
`;
export { Container };
