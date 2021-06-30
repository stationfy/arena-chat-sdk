import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

const Container = styled.div`
  display: flex;
`;

const TabItem = styled.span<{ selected?: boolean }>`
  color: ${({ selected }) => (selected ? theme.colors.mediumBlue : theme.colors.lightBlue)};
  padding: ${({ selected }) => (selected ? '10px 30px' : '10px')};

  cursor: pointer;
  background-color: ${({ selected }) => (selected ? theme.colors.white : 'transparent')};
  border-radius: ${({ selected }) => (selected ? '20px' : 0)};

  &:hover {
    color: ${({ selected }) => (selected ? theme.colors.mediumBlue : theme.colors.white)};
  }
`;

export { Container, TabItem };
