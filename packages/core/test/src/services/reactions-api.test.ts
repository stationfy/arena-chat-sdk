import { ReactionsAPIWS } from '@services/reactions-api-ws';
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
  const instance = ReactionsAPIWS.getInstance(channelId);

  expect(instance).toBeInstanceOf(ReactionsAPIWS);
});

test('should validate createReaction method', () => {
  ReactionsAPIWS.getInstance(channelId).createReaction({} as ServerReaction);

  expect(WebSocketTransport.getInstance(channelId).emit).toHaveBeenCalledWith('reaction.create', {});
});

test('should validate watchChannelReactions method', () => {
  const callback = jest.fn();
  ReactionsAPIWS.getInstance(channelId).watchChannelReactions(callback);

  expect(callback).not.toHaveBeenCalled();
});
