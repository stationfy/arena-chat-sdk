import styled from 'styled-components';

const Container = styled.button<{ iconUrl: string; size?: number; hideOnMobile?: boolean }>`
  background-image: url(${({ iconUrl }) => (iconUrl ? iconUrl : '')});
  background-position: center;
  background-size: cover;
  background-repeat: no-repeat;
  height: ${({ size }) => (size ? `${size}px` : '20px')};
  width: ${({ size }) => (size ? `${size}px` : '20px')};
  border: none;
  background-color: transparent;
  cursor: pointer;
  &:focus {
    outline: none;
  }

  @media (max-width: 460px) {
    display: ${({ hideOnMobile }) => (hideOnMobile ? 'none' : 'flex')};
  }
`;

export { Container };
