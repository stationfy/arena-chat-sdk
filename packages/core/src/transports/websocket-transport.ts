import { io, Socket } from 'socket.io-client';
import CoreConfig from '@arena-im/config-sdk';


type Instance = {
  [key: string]: Socket;
};

export class WebSocketTransport {
  private static instance: Instance = {};

  public static getInstance(channelId: string): Socket {
    if (!this.instance[channelId]) {
      this.instance[channelId] = io(CoreConfig.enviroment?.ARENA_REALTIME_URL || '', {
        transports: ['websocket'],
      });
    }

    return this.instance[channelId];
  }
}
