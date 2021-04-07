import styled from 'styled-components';

const Container = styled.div<{ imageUrl: string; size?: number }>`
  height: ${({ size }) => (size ? size : 40)}px;
  width: ${({ size }) => (size ? size : 40)}px;
  max-width: ${({ size }) => (size ? size : 40)}px;
  min-width: ${({ size }) => (size ? size : 40)}px;
  border-radius: 50%;
  background-image: url(${({ imageUrl }) => (imageUrl ? imageUrl : '')});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
`;

export { Container };
