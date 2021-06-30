import { io, Socket } from 'socket.io-client';
import { ARENA_REALTIME_URL } from '../config';

export class WebSocketTransport<EventsMap, ListenEvents> {
  public client: Socket<EventsMap, ListenEvents>;

  constructor() {
    this.client = io(ARENA_REALTIME_URL, {
      forceNew: true,
      transports: ['websocket'],
    });
  }
}
