import styled from 'styled-components';

import { theme } from 'stylesheets/theme';

const Container = styled.div`
  display: inline-block;
  color: #000;
  width: 380px;
  background-color: ${theme.colors.lightGrey};
  max-height: 100px;
  overflow-y: auto;
  overflow-x: hidden;
  white-space: pre-wrap;
  padding: 10px 16px;
  font-size: 1em;
  line-height: 1.3em;
  border-radius: 5px;

  &:focus {
    outline: none;
  }
`;

export { Container };
