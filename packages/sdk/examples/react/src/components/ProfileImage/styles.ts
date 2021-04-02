import styled from 'styled-components';

const Container = styled.div<{ imageUrl: string }>`
  height: 40px;
  width: 40px;
  border-radius: 50%;
  background-image: url(${({ imageUrl }) => (imageUrl ? imageUrl : '')});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
`;

export { Container };
