import { Subject, BehaviorSubject } from 'rxjs';
import { Logger } from '../services/logger';
import { promiseTimeout } from '../utils/misc';

// Set the reconnect interval (5 seconds)
const RECONNECT_INTERVAL = 5000;
// Set the connection timeout (4 seconds)
const CONNECTION_TIMEOUT = 4000;
// Set the ping pong to check the server connect (30 seconds)
const PING_PONG_TIMEOUT = 30000;

const MAX_MISS_PINGS = 3;

const SEND_MESSAGE_PROMISE_TIMEOUT = 1000000;

const MAX_RECONNECTIONS_TRIES = 10

export class ArenaSocket {
  private static instances: { [key: string]: ArenaSocket } = {};
  private socket?: WebSocket;
  private errorObservable$: Subject<string | Event> = new Subject();
  private connectionFailedObservable$: Subject<string> = new Subject();
  private messageObeservable$: Subject<any> = new Subject();
  private connectionCloseObeservable$: Subject<string> = new Subject();
  private clientConnectionFailedObservable$: Subject<string> = new Subject();
  private socketConnectionFailedObservable$: Subject<string> = new Subject();
  private connectionConnectObeservable$ = new BehaviorSubject(false);
  private reconnectObeservable$: Subject<boolean> = new Subject();
  private isTryingToReconnect = false;
  private connectTimeout?: NodeJS.Timeout;
  private pingPongTimeout?: NodeJS.Timeout;
  private keepAliveTimeout?: NodeJS.Timeout;
  private reconnectTimeout?: NodeJS.Timeout;
  private missedPings = 0;
  private keyCallbacks: Map<string, (data: any) => void> = new Map();
  private isOffline = false
  private failedSocketReconnections = 0

  constructor(private readonly endpoint: string) {
    this.socket = this.connect();
  }

  static getInstance(endpoint: string): ArenaSocket {
    if (!ArenaSocket.instances[endpoint]) {
      ArenaSocket.instances[endpoint] = new ArenaSocket(endpoint);
    }

    return ArenaSocket.instances[endpoint];
  }
  public connect(): WebSocket {
    if (this.socket) {
      this.close();
    }

    this.connectTimeout = setTimeout(() => this.handleTimeout(), CONNECTION_TIMEOUT);

    const socket = new window.WebSocket(this.endpoint);
    this.addListeners(socket);
    return socket;
  }

  private pinPong(): void {
    this.missedPings++;

    if (this.missedPings >= MAX_MISS_PINGS) {
      this.errorObservable$.next(`miss pings: ${this.missedPings}`);
      return;
    }

    if (!this.socket) {
      return;
    }

    this.socket.send('ping');

    this.pingPongTimeout = setTimeout(this.pinPong.bind(this), PING_PONG_TIMEOUT);
  }

  private handleTimeout(): void {
    this.errorObservable$.next('TIMEOUT');
  }

  close(): void {
    if (!this.socket) return;

    this.socket.close();
    this.socket = undefined;
    this.cleanAllTimeouts();
  }

  private cleanAllTimeouts(): void {
    if (this.connectTimeout) {
      clearTimeout(this.connectTimeout);
    }

    if (this.keepAliveTimeout) {
      clearTimeout(this.keepAliveTimeout);
    }

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.pingPongTimeout) {
      clearTimeout(this.pingPongTimeout);
    }
  }

  private reconnect(): void {
    Logger.instance.log('warn', 'ArenaSocket reconnect', {
      isDisconnected:
        this.socket?.readyState === window.WebSocket.CLOSED || this.socket?.readyState === window.WebSocket.CLOSING,
      isConnecting: this.socket?.readyState === window.WebSocket.CONNECTING,
      isOnline: window.navigator.onLine,
      isTryingToReconnect: this.isTryingToReconnect,
    });

    this.isTryingToReconnect = true;

    this.reconnectTimeout = setTimeout(() => {
      this.connect();
    }, RECONNECT_INTERVAL);
  }

  private addListeners(socket: WebSocket): void {
    if (!socket) {
      return;
    }

    socket.onopen = () => {
      if (this.connectTimeout) {
        clearTimeout(this.connectTimeout);
      }
      this.pinPong();
      this.connectionConnectObeservable$.next(true);
    };

    socket.onclose = () => {
      this.connectionCloseObeservable$.next('closed');
    };

    socket.onerror = (event) => {
      Logger.instance.log('error', 'ArenaSocket onerror', {
        error: event,
        isDisconnected:
          this.socket?.readyState === window.WebSocket.CLOSED || this.socket?.readyState === window.WebSocket.CLOSING,
        isConnecting: this.socket?.readyState === window.WebSocket.CONNECTING,
        isOnline: window.navigator.onLine,
        isTryingToReconnect: this.isTryingToReconnect,
      });
      this.errorObservable$.next(event);
    };

    socket.onmessage = (event) => {
      if (event.data === 'pong') {
        this.missedPings--;
      } else if (event.type === 'message') {
        const data = JSON.parse(event.data);
        const currentCallback = this.keyCallbacks.get(data.key);

        if (data.errMsg) {
          console.log('data.errMsg', data.errMsg);
          return;
        }
        if (currentCallback) {
          //@ts-ignore
          const messages = data.payload.map((message) => message.content);
          currentCallback(messages);
        }

        if (data.KindName) {
          this.messageObeservable$.next({ ...data.Content, changeType: data.KindName });
        }
      } else {
        this.messageObeservable$.next(event.data);
      }
    };


    window.addEventListener('offline', () => {
      this.isOffline = true
    })

    window.addEventListener('online', () => {
      if (this.isOffline === true) {
        if (this.isDisconnected()) {
          this.clientConnectionFailedObservable$.next('Client connection reestablished')
        }
        this.isOffline = false
      }
    })

    window.addEventListener('focus', () => {
      if (this.isDisconnected()) {
        this.clientConnectionFailedObservable$.next('ArenaSocket connection lost while page not focused')
      }
    })

    this.socketConnectionFailedObservable$.subscribe((value) => {
      if (this.failedSocketReconnections >= MAX_RECONNECTIONS_TRIES) {
        this.connectionFailedObservable$.next('Failed to reconnect')
      }
      this.failedSocketReconnections++
      Logger.instance.log('error', value)
      this.reconnect()
    })

    this.clientConnectionFailedObservable$.subscribe((value) => {
      Logger.instance.log('info', value)
      this.reconnect()
    })
  }

  public finish(): void {
    this.close();
    this.cleanAllTimeouts();
    this.completeAllObservables();
  }

  private isDisconnected () {
    return this.socket?.readyState === window.WebSocket.CLOSED || this.socket?.readyState === window.WebSocket.CLOSING
  }

  private completeAllObservables(): void {
    this.errorObservable$.complete();
    this.socketConnectionFailedObservable$.complete()
    this.clientConnectionFailedObservable$.complete()
    this.messageObeservable$.complete();
    this.connectionCloseObeservable$.complete();
    this.connectionConnectObeservable$.complete();
    this.connectionFailedObservable$.complete();
    this.reconnectObeservable$.complete()
  }

  public on(
    type: 'connectFailed' | 'connect' | 'message' | 'close' | 'error' | 'reconnect',
    callback: (value: any) => void,
  ): () => void {
    let observable: Subject<any> | undefined;

    switch (type) {
      case 'error':
        observable = this.errorObservable$;
        break;
      case 'connectFailed':
        observable = this.connectionFailedObservable$;
        break;
      case 'connect':
        observable = this.connectionConnectObeservable$;
        break;
      case 'message':
        observable = this.messageObeservable$;
        break;
      case 'close':
        observable = this.connectionCloseObeservable$;
        break;
      case 'reconnect':
        observable = this.reconnectObeservable$;
        break;
    }

    if (observable) {
      observable.subscribe(callback);
    }

    return observable.unsubscribe.bind(this);
  }

  public send<T>(type: string, options: { [key: string]: unknown }): Promise<T> {
    if (!this.socket) {
      throw new Error('ArenaSocket not found.');
    }
    return promiseTimeout(
      new Promise((resolve) => {
        const connectionSubscription = this.connectionConnectObeservable$.subscribe((connected) => {
          if (connected) {
            setTimeout(() => {
              connectionSubscription.unsubscribe();
            }, 0);
            const key = `${+new Date()}`;
            const message = JSON.stringify({ ...options, cmd: type, key });

            this.keyCallbacks.set(key, resolve);
            if (this.socket) {
              this.socket.send(message);
            }
          }
        });
      }),
      SEND_MESSAGE_PROMISE_TIMEOUT,
    );
  }
}
