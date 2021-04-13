import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  padding: 10px 0;
`;

const ChannelOption = styled.button<{ active?: boolean }>`
  display: flex;
  width: 100%;
  flex-direction: flex-start;
  background-color: ${({ active }) => (active ? theme.colors.mediumBlue : theme.colors.white)};
  color: ${({ active }) => (active ? theme.colors.white : theme.colors.black)};
  padding: 15px 30px;
  border: 1px solid ${theme.colors.lightGrey};
  font-size: 1em;
  font-weight: 400;
  cursor: pointer;

  &:hover {
    background-color: ${({ active }) => (active ? theme.colors.mediumBlue : theme.colors.lightGrey)};
  }

  &:focus {
    outline: none;
  }
`;

export { Container, ChannelOption };
