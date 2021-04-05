import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

export const Container = styled.div<{ owner?: boolean }>`
  padding: 15px;
  background-color: ${({ owner }) => (owner ? theme.colors.mediumBlue : theme.colors.lightBlue)};
  color: ${({ owner }) => (owner ? theme.colors.white : theme.colors.darkBlue)};
  margin-left: 10px;
  min-height: 20px;
  border-radius: 10px;
`;
