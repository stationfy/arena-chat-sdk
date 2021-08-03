import { io, Socket } from 'socket.io-client';
import { ARENA_REALTIME_URL } from '../config';

type Instance = {
  [key: string]: Socket;
};

export class WebSocketTransport {
  private static instance: Instance = {};

  public static getInstance(channelId: string): Socket {
    if (!this.instance[channelId]) {
      this.instance[channelId] = io(ARENA_REALTIME_URL, {
        transports: ['websocket'],
      });
    }

    return this.instance[channelId];
  }
}
