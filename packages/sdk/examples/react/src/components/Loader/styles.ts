import styled, { keyframes } from 'styled-components';
import { theme } from 'stylesheets/theme';
import { ILoader } from './types';

const spin = keyframes`
from {
    transform: rotate(0deg);
}
to{
    transform: rotate(360deg);
}

`;

export const Container = styled.div<{ size?: number }>`
  border: 2px solid ${theme.colors.lightGrey};
  border-top: 2px solid ${theme.colors.mediumBlue};
  border-radius: 50%;
  width: ${({ size }) => (size ? size : 20)}px;
  height: ${({ size }) => (size ? size : 20)}px;
  animation: ${spin} 2s linear infinite;
`;
