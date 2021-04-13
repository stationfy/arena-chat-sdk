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

Header.LoginArea = styled.div`
  flex: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: ${theme.colors.mediumBlue};
  border-radius: 21px;

  button {
    display: flex;
    justify-content: center;
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 10px;
    background-color: ${theme.colors.white};
    color: ${theme.colors.mediumBlue};
    text-transform: uppercase;
    font-weight: bold;
    cursor: pointer;

    &:focus {
      outline: none;
    }

    &:hover,
    &:disabled {
      background-color: ${theme.colors.lightGrey};
    }
  }

  p {
    color: ${theme.colors.white};
  }
`;

Header.SettingsArea = styled.div`
  flex: 1;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  position: relative;
`;

Header.ModeratorArea = styled.div`
  padding: 10px 0 0 60px;
`;

const List = styled.div`
  flex: 6;
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

const LoadingMessages = styled.div`
  display: flex;
  height: 100%;
  width: 100%;
  justify-content: center;
  align-items: center;
`;

const ModeratorButton = styled.button`
  position: absolute;
  display: flex;
  justify-content: center;
  align-items: center;
  top: -20px;
  width: 170px;
  height: 35px;
  background-color: white;
  right: -75px;
  border: none;
  box-shadow: 10px 10px 26px -11px rgba(0, 0, 0, 0.82);
  border-radius: 30px;
  color: ${theme.colors.mediumBlue};
  font-size: 0.9em;
  font-weight: 400;
  cursor: pointer;

  &:hover {
    color: ${theme.colors.darkBlue};
  }

  &:focus {
    outline: none;
  }
`;

const ModeratorTag = styled.div`
  height: 15px;
  background: ${theme.colors.mediumBlue};
  font-size: 0.8em;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  margin-left: 10px;
  padding: 4px;
  border-radius: 7px;
  text-transform: uppercase;
`;

export { Container, Header, Footer, List, LoadingMessages, ModeratorButton, ModeratorTag };
