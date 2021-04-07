import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

const MessageItem: any = styled.div<{ owner?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: ${({ owner }) => (owner ? 'flex-end' : 'flex-start')};
  padding: 5px 10px;
`;

MessageItem.Info = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  flex-direction: column;

  p {
    font-size: 0.8em;
    margin: 0 0 4px 0;
    font-weight: bold;
    color: ${theme.colors.darkBlue};
  }
  span {
    font-size: 0.7em;
    color: ${theme.colors.mediumGrey};
    margin-bottom: 10px;
  }
`;
MessageItem.Content = styled.div`
  display: flex;
  align-items: flex-start;
`;

MessageItem.Text = styled.div<{ owner?: boolean }>`
  padding: 15px;
  background-color: ${({ owner }) => (owner ? theme.colors.mediumBlue : theme.colors.lightBlue)};
  color: ${({ owner }) => (owner ? theme.colors.white : theme.colors.darkBlue)};
  margin-left: 10px;
  min-height: 20px;
  border-radius: 10px;
`;

const FollowedMessage = styled.div`
  width: 50px;
`;

export { MessageItem, FollowedMessage };
