import { ArenaSocket } from '../../../src/transports/arena-socket-transport';
import { ChatMessage } from '@arena-im/chat-types';
import { exampleArenaSocketMessage } from '../../../../chat-sdk/test/fixtures/chat-examples';

const mockedCloseSocketConnection = jest.fn();
const mockedSendSocketMessage = jest.fn();

describe('Arena Socket Transport', () => {
  let arenaSocket: ArenaSocket;
  beforeEach(() => {
    // @ts-ignore
    global.WebSocket = () => {
      return {
        OPEN: true,
        send: mockedSendSocketMessage,
        close: mockedCloseSocketConnection,
      };
    };
    arenaSocket = ArenaSocket.getInstance(`http://localhost:3000?r=${Math.random()}`);
  });

  it('should connect on arena socket', () => {
    expect(arenaSocket.socket?.OPEN).toEqual(true);
  });

  describe('close()', () => {
    it('should close the connection with arena socket', () => {
      arenaSocket.close();

      expect(mockedCloseSocketConnection).toBeCalled();
    });
  });

  describe('send()', () => {
    it('should send messages to arena socket', () => {
      arenaSocket.send('range', { before: +new Date(), count: 10 });

      // @ts-ignore
      arenaSocket.socket.onopen(true);

      expect(mockedSendSocketMessage).toBeCalled();
    });
  });

  describe('on()', () => {
    it('should listen to arena socket messages', (done) => {
      arenaSocket.on('message', (message: ChatMessage) => {
        expect(message.key).toEqual('test-message-id');
        done();
      });

      // @ts-ignore
      arenaSocket.socket?.onmessage(exampleArenaSocketMessage);
    });
  });
});
