import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  height: 90vh;
  background-color: ${theme.colors.white};
  width: 100%;
  border-radius: 5px;

  @media (max-width: 460px) {
    height: 100vh;
    border-radius: 0 0 15px 15px;
  }
`;

const Header: any = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 20px;

  border-radius: 5px 5px 10px 10px;
  background-color: ${theme.colors.darkBlue};

  box-shadow: 1px 12px 11px -8px rgba(0, 0, 0, 0.37);

  @media (max-width: 460px) {
    border-radius: 0 0 15px 15px;
  }
`;

Header.Info = styled.div`
  display: flex;
  justify-content: center;
  align-items: space-between;
`;

Header.Tabs = styled.div`
  padding: 30px;
  font-weight: 400;
  font-size: 0.9em;
  padding: 20px 0 5px 8px;
`;

Header.ProfileArea = styled.div`
  flex: 3;
  display: flex;

  align-items: center;

  h1 {
    color: ${theme.colors.white};
    margin-left: 12px;
    font-size: 1.3em;
    font-weight: 400;
  }
`;

Header.SettingsArea = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
`;

const List = styled.div`
  flex: 6;
  padding-bottom: 10px;
  overflow-y: hidden;
`;

const Footer = styled.div`
  flex: 1;
  display: flex;
  padding: 0 20px;
  justify-content: space-between;
  align-items: center;
  padding: 0 25px 5px 25px;
`;

export { Container, Header, Footer, List };
