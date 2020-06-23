import { BaseRealtime } from '../models/base-realtime';
import {
  listenToCollectionChange,
  listenToDocumentChange,
  fetchCollectionItems,
  listenToCollectionItemChange,
} from '../services/firestore-api';
import { ChatMessage } from '../models/chat-message';
import { ChatRoom } from '../models/chat-room';

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

  /**
   * @inheritdoc
   */
  public async fetchRecentMessages(limit?: number): Promise<ChatMessage[]> {
    const messages = await fetchCollectionItems({
      path: `chat-rooms/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
    });

    return messages.reverse() as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public async fetchPreviousMessages(firstMessage: ChatMessage, limit?: number): Promise<ChatMessage[]> {
    if (limit) {
      limit = limit + 1;
    }

    const messages = await fetchCollectionItems({
      path: `chat-rooms/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
      startAt: [firstMessage.createdAt],
    });

    messages.reverse();

    messages.pop();

    return messages as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public listenToChatNewMessage(callback: (message: ChatMessage) => void): void {
    listenToCollectionItemChange(
      {
        path: `chat-rooms/${this.channel}/messages`,
      },
      (data) => {
        callback(data as ChatMessage);
      },
    );
  }
}
