import { BaseRealtime } from '../types/base-realtime';
import { listenToCollectionChange, listenToDocumentChange } from './firestore-api';
import { ChatMessage } from '../types/chat-message';
import { ChatRoom } from '../types/chat-room';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtime {
  /** Unsubscribe functions */
  private unsbscriteFunctions: (() => void)[] = [];

  public constructor(private channel: string) {}

  /**
   * @inheritDoc
   */
  public listenToMessage(callback: (messages: ChatMessage[]) => void, limit?: number): void {
    const unsubscribe = listenToCollectionChange(
      {
        path: `chat-rooms/${this.channel}/messages`,
        limit,
      },
      (response) => {
        const messages: ChatMessage[] = response.map((messageData) => ({
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
    );

    this.unsbscriteFunctions.push(unsubscribe);
  }

  /**
   * @inheritdoc
   */
  public listenToBannedUsers(callback: () => void): void {
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
  public listenToChatConfigChanges(callback: (chatRoom: ChatRoom) => void): void {
    const unsubscribe = listenToDocumentChange(
      {
        path: `chat-rooms/${this.channel}`,
      },
      (data) => {
        const chatRoom: ChatRoom = data as ChatRoom;

        callback(chatRoom);
      },
    );
    this.unsbscriteFunctions.push(unsubscribe);
  }

  /** Unsubscribe from all listeners */
  public unsubscribeAll(): void {
    this.unsbscriteFunctions.forEach((fn) => fn());
  }
}
