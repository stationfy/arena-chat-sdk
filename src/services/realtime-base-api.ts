import { RealtimeBase } from '../types/realtime-base';
import { listenToChange } from './firestore-api';
import { ChatMessage } from '../types/chat-message';

/** Base realtime class implementation */
export class RealtimeBaseAPI implements RealtimeBase {
  /** Unsubscribe functions */
  private unsbscriteFunctions: Function[] = [];

  public constructor(private channel: string) {}

  /**
   * @inheritDoc
   */
  public listenToMessage(callback: (messages: ChatMessage[]) => void) {
    const unsubscribe = listenToChange({
      path: `chat-rooms/${this.channel}/messages`,
      callback: (data) => {
        const messages = data.map((messageData) => ({
          createdAt: messageData.createdAt,
          key: messageData.key,
          message: messageData.message,
          siteId: messageData.publisherId,
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
  public listenToBannedUsers(callback: Function) {
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
  public listenToChatConfigChanges(callback: Function) {
    console.log(callback);
    // const unsubscribe = listenToChange({
    //   path: `chat-rooms/${this.channel}`,
    //   callback: callback,
    // });
    // this.unsbscriteFunctions.push(unsubscribe);
  }

  /** Unsubscribe from all listeners */
  public unsubscribeAll() {
    this.unsbscriteFunctions.forEach((fn) => fn());
  }
}
