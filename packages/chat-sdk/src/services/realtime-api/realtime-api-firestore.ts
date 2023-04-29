import { FirestoreAPI } from '@arena-im/core';
import { BaseRealtimeAPI, ChatMessage, ListenChangeConfig } from '@arena-im/chat-types';

export class RealtimeApiFirestore implements BaseRealtimeAPI {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor(private readonly dataPath: string) {}

  private unsbscribeFunctions: (() => void)[] = [];

  public close(): void {
    this.unsbscribeFunctions.forEach((unsubscribe) => unsubscribe());
  }

  public async fetchRecentMessages(limit: number): Promise<ChatMessage[]> {
    if (!this.dataPath) {
      throw new Error('failed');
    }

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
    if (!this.dataPath) {
      throw new Error('failed');
    }

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

  public listenToMessage(callback: (message: ChatMessage) => void): () => void {
    if (!this.dataPath) {
      throw new Error('failed');
    }

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
            const change = changes[changes.length - 1]
            
            const data = change.doc.data();
            data.changeType = change.type;

            console.log('data', data)
            callback(data as ChatMessage);
          }
        }
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }
}
