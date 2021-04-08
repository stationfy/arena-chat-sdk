import styled from 'styled-components';
import { theme } from 'stylesheets/theme';

import { heart, filledHeart } from 'assets/icons';

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
  cursor: default;
  position: relative;
`;

MessageItem.Reaction = styled.button<{ filled: boolean }>`
  position: absolute;
  background-color: transparent;
  background-image: url(${({ filled }) => (filled ? filledHeart : heart)});
  background-position: center;
  background-repeat: no-repeat;
  background-size: cover;
  border: none;
  width: 12px;
  height: 12px;
  right: -2px;
  bottom: -5px;
  cursor: pointer;

  :focus {
    outline: none;
  }
`;

MessageItem.ModeratorTag = styled.span`
  height: 10px;
  background: ${theme.colors.mediumBlue};
  font-size: 0.5em;
  display: flex;
  justify-content: center;
  align-items: center;
  color: white;
  margin-left: -1px;
  margin-bottom: 4px;
  padding: 4px;
  border-radius: 8px;
  text-transform: uppercase;
`;

MessageItem.ModeratorActions = styled.div`
  display: flex;
  margin-bottom: 5px;
  margin-top: -4px;
`;

const FollowedMessage = styled.div`
  width: 50px;
`;

export { MessageItem, FollowedMessage };
