import { FirestoreAPI } from '@arena-im/core';
import { BaseRealtimeAPI, ChatMessage, ListenChangeConfig } from '@arena-im/chat-types';

export class RealtimeApiFirestore implements BaseRealtimeAPI {
  private unsbscribeFunctions: (() => void)[] = [];

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private readonly dataPath: string) {}

  public listenToMessage(callback: (message: ChatMessage) => void): () => void {
    let initialData = true;

    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `${this.dataPath}/messages`,
        orderBy: [
          {
            field: 'createdAt',
            desc: true,
          },
        ],
      },
      (changes) => {
        if (initialData) {
          initialData = false;
        } else {
          if (changes.length) {
            const change = changes[changes.length - 1];

            const data = change.doc.data();
            data.changeType = change.type;

            callback(data as ChatMessage);
          }
        }
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  public async fetchRecentMessages(limit: number): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `${this.dataPath}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
    };

    const messages = await FirestoreAPI.fetchCollectionItems(config);

    return messages.reverse() as ChatMessage[];
  }

  public async fetchPreviousMessages(limit: number, before: number): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `${this.dataPath}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
      startAt: [before - 1],
    };

    const messages = await FirestoreAPI.fetchCollectionItems(config);

    messages.reverse();

    return messages as ChatMessage[];
  }

  public close(): void {
    this.unsbscribeFunctions.forEach((unsubscribe) => unsubscribe());
  }
}
