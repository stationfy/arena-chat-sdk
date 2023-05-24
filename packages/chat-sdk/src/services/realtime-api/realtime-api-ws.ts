import { ArenaSocket } from '@arena-im/core';
import { ARENA_CHAT_WS } from '../../config';
import { Logger } from '@arena-im/core';
import { BaseRealtimeAPI, ChatMessage } from '@arena-im/chat-types';

export class RealtimeApiWS implements BaseRealtimeAPI {
  private arenaSocket: ArenaSocket;
  private unsbscribeFunctions: (() => void)[] = [];

  constructor(private chatroomId: string, private channelId: string, private fallback: () => void) {
    this.fallback = fallback;
    this.arenaSocket = ArenaSocket.getInstance(
      `${ARENA_CHAT_WS}?roomId=${this.chatroomId}&channelId=${this.channelId}`,
    );

    this.addListeners();
  }

  public listenToMessage(callback: (message: ChatMessage) => void): () => void {
    const unsubscribe = this.arenaSocket.on('message', callback);

    this.unsbscribeFunctions.push(unsubscribe);
    return unsubscribe;
  }

  public fetchRecentMessages(limit: number): Promise<ChatMessage[]> {
    return this.arenaSocket.send('range', { before: +new Date(), count: limit ?? 10 });
  }

  public fetchPreviousMessages(limit: number, beforeTimestamp: number): Promise<ChatMessage[]> {
    return this.arenaSocket.send('range', { before: beforeTimestamp, count: limit ?? 10 });
  }

  public close(): void {
    if (this.unsbscribeFunctions.length) {
      this.unsbscribeFunctions.forEach((unsubscribe) => {
        if (unsubscribe) {
          unsubscribe();
        }
      });
    }
    this.arenaSocket.close();
  }

  private handleFallback(): void {
    Logger.instance.log('error', 'RealtimeWS: calling fallback');
    this.arenaSocket.close();
    this.fallback();
  }

  private addListeners(): void {
    const reconnectUnsubscribe = this.arenaSocket.on('reconnect', () => {
      return;
    });
    this.unsbscribeFunctions.push(reconnectUnsubscribe);

    const errorUnsubscribe = this.arenaSocket.on('error', (error) => {
      Logger.instance.log('error', 'RealtimeWS: WS error from server', error);
      this.handleFallback();
    });
    this.unsbscribeFunctions.push(errorUnsubscribe);

    const connectionUnsubscribe = this.arenaSocket.on('connectFailed', (error) => {
      Logger.instance.log('error', 'RealtimeWS: WS connection failed', error);
      this.handleFallback();
    });
    this.unsbscribeFunctions.push(connectionUnsubscribe);
  }
}
