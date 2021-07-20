import { io, Socket } from 'socket.io-client';
import { ARENA_REALTIME_URL } from '../config';

export class WebSocketTransport {
  private static client: Socket;

  constructor() { }

  public static get instance() {
    if (!WebSocketTransport.client) {
      WebSocketTransport.client = io(ARENA_REALTIME_URL, {
        transports: ['websocket'],
      });
    }

    return WebSocketTransport.client;
  }
}
