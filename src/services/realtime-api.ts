import { BaseRealtime } from '../types/base-realtime';
import { listenToChange } from './firestore-api';
import { ChatMessage } from '../types/chat-message';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtime {
  /** Unsubscribe functions */
  private unsbscriteFunctions: (() => void)[] = [];

  public constructor(private channel: string) {}

  /**
   * @inheritDoc
   */
  public listenToMessage(callback: (messages: ChatMessage[]) => void, limit?: number): void {
    const unsubscribe = listenToChange({
      path: `chat-rooms/${this.channel}/messages`,
      limit,
      callback: (data) => {
        const messages = data.map((messageData) => ({
          createdAt: messageData.createdAt,
          key: messageData.key,
          message: messageData.message,
          publisherId: messageData.publisherId,
          referer: messageData.referer,
          replyMessage: messageData.replyMessage,
          sender: messageData.sender,
        }));

        callback(messages);
      },
    });

    this.unsbscriteFunctions.push(unsubscribe);
  }

  /**
   * @inheritdoc
   */
  public listenToBannedUsers(callback: Function): void {
    console.log(callback);
    // const unsubscribe = listenToChange({
    //   path: 'banned-users',
    //   where: [
    //     {
    //       fieldPath: 'siteId',
    //       opStr: '==',
    //       value: this.channel,
    //     },
    //   ],
    //   callback,
    // });
    // this.unsbscriteFunctions.push(unsubscribe);
  }

  /**
   * @inheritdoc
   */
  public listenToChatConfigChanges(callback: Function): void {
    console.log(callback);
    // const unsubscribe = listenToChange({
    //   path: `chat-rooms/${this.channel}`,
    //   callback: callback,
    // });
    // this.unsbscriteFunctions.push(unsubscribe);
  }

  /** Unsubscribe from all listeners */
  public unsubscribeAll(): void {
    this.unsbscriteFunctions.forEach((fn) => fn());
  }
}
