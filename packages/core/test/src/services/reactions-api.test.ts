import { ReactionsAPI } from '@services/reactions-api';
import { WebSocketTransport } from '@transports/websocket-transport';
import { ServerReaction } from '@arena-im/chat-types';

jest.mock('@transports/websocket-transport', () => ({
  WebSocketTransport: {
    getInstance: jest.fn().mockReturnValue({
      on: jest.fn(),
      emit: jest.fn(),
    }),
  },
}));

const channelId = '1';

test('should validate getInstance method', () => {
  const instance = ReactionsAPI.getInstance(channelId);

  expect(instance).toBeInstanceOf(ReactionsAPI);
});

test('should validate createReaction method', () => {
  ReactionsAPI.getInstance(channelId).createReaction({} as ServerReaction);

  expect(WebSocketTransport.getInstance(channelId).emit).toHaveBeenCalledWith('reaction.create', {});
});

test('should validate retrieveUserReactions method', () => {
  ReactionsAPI.getInstance(channelId).retrieveUserReactions();

  expect(WebSocketTransport.getInstance(channelId).emit).toHaveBeenCalledWith('reaction.retrieve', {}, expect.any(Function));
});

test('should validate watchChannelReactions method', () => {
  const callback = jest.fn();
  ReactionsAPI.getInstance(channelId).watchChannelReactions(callback);

  expect(callback).not.toHaveBeenCalled();
});
