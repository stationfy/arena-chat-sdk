import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

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
  font-size: 1em;
  padding: 11px;
`;

Container.Answer = styled.div`
  display: flex;
  background: ${theme.colors.lightBlue};
  padding: 11px;
  font-size: 0.9em;

  strong {
    margin-right: 5px;
  }
`;

Container.Tag = styled.span`
  margin-left: 10px;
  padding: 10px;
  background-color: ${theme.colors.qnaColor};
  font-size: 0.9em;
  color: ${theme.colors.white};
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
