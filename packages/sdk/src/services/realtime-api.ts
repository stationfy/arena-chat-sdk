import {
  ChatMessage,
  ChatRoom,
  ServerReaction,
  ExternalUser,
  GroupChannel,
  ListenChangeConfig,
  OrderBy,
  QnaProps,
  PollFilter,
  Poll,
  Where,
  QnaQuestion,
  QnaQuestionFilter,
} from '@arena-im/chat-types';
import { BaseRealtime } from '../interfaces/base-realtime';
import {
  listenToCollectionChange,
  listenToDocumentChange,
  fetchCollectionItems,
  listenToCollectionItemChange,
  addItem,
  fetchDocument,
} from '../services/firestore-api';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtime {
  /** Unsubscribe functions */
  private unsbscribeFunctions: (() => void)[] = [];

  public constructor(private channel?: string) {}

  /**
   * @inheritDoc
   */
  public async fetchAllQnaQuestions(qnaId: string, limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]> {
    let orderBy: OrderBy;

    if (filter === QnaQuestionFilter.POPULAR) {
      orderBy = {
        field: 'upvotes',
        desc: true,
      };
    } else {
      orderBy = {
        field: 'createdAt',
        desc: true,
      };
    }

    const config: ListenChangeConfig = {
      path: `qnas/${qnaId}/questions`,
      orderBy: [orderBy],
      limit,
    };

    const questions = await fetchCollectionItems(config);

    return questions as QnaQuestion[];
  }

  /**
   * @inheritdoc
   */
  public async fetchAllPolls(filter?: PollFilter, limit?: number): Promise<Poll[]> {
    let orderBy: OrderBy;
    const where: Where[] = [
      {
        fieldPath: 'chatRoomId',
        opStr: '==',
        value: this.channel,
      },
      {
        fieldPath: 'draft',
        opStr: '==',
        value: false,
      },
    ];

    if (filter === PollFilter.POPULAR) {
      orderBy = {
        field: 'total',
        desc: true,
      };
    } else if (filter === PollFilter.ACTIVE) {
      orderBy = {
        field: 'expireAt',
        desc: true,
      };

      where.push({
        fieldPath: 'expireAt',
        opStr: '>=',
        value: +new Date(),
      });
    } else if (filter === PollFilter.ENDED) {
      orderBy = {
        field: 'expireAt',
        desc: true,
      };

      where.push({
        fieldPath: 'expireAt',
        opStr: '<',
        value: +new Date(),
      });
    } else {
      orderBy = {
        field: 'createdAt',
        desc: true,
      };
    }

    const config: ListenChangeConfig = {
      path: 'polls',
      orderBy: [orderBy],
      limit,
      where,
    };

    const polls = await fetchCollectionItems(config);

    return polls as Poll[];
  }

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

    this.unsbscribeFunctions.push(unsubscribe);
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
    // this.unsbscribeFunctions.push(unsubscribe);
  }

  /**
   * @inheritdoc
   */
  public listenToChatConfigChanges(callback: (chatRoom: ChatRoom) => void): () => void {
    const unsubscribe = listenToDocumentChange(
      {
        path: `chat-rooms/${this.channel}`,
      },
      (data) => {
        const chatRoom: ChatRoom = data as ChatRoom;

        callback(chatRoom);
      },
    );
    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /** Unsubscribe from all listeners */
  public unsubscribeAll(): void {
    this.unsbscribeFunctions.forEach((fn) => fn());
  }

  /**
   * @inheritdoc
   */
  public async fetchRecentMessages(limit?: number): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `chat-rooms/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
    };

    const messages = await fetchCollectionItems(config);

    return messages.reverse() as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public async fetchGroupRecentMessages(limit?: number, lastClearedTimestamp?: number): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `group-channels/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
    };

    if (lastClearedTimestamp) {
      config.endAt = [lastClearedTimestamp];
    }

    const messages = await fetchCollectionItems(config);

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
  public async fetchGroupPreviousMessages(
    firstMessage: ChatMessage,
    lastClearedTimestamp?: number,
    limit?: number,
  ): Promise<ChatMessage[]> {
    if (limit) {
      limit = limit + 1;
    }

    const config: ListenChangeConfig = {
      path: `group-channels/${this.channel}/messages`,
      orderBy: [
        {
          field: 'createdAt',
          desc: true,
        },
      ],
      limit,
      startAt: [firstMessage.createdAt],
    };

    if (lastClearedTimestamp) {
      config.endAt = [lastClearedTimestamp];
    }

    const messages = await fetchCollectionItems(config);

    messages.reverse();

    messages.pop();

    return messages as ChatMessage[];
  }

  public listenToQuestionReceived(callback: (message: QnaQuestion) => void): () => void {
    const unsubscribe = listenToCollectionItemChange(
      {
        path: `qnas/${this.channel}/questions`,
      },
      (data) => {
        callback(data as QnaQuestion);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToMessageReceived(callback: (message: ChatMessage) => void): () => void {
    const unsubscribe = listenToCollectionItemChange(
      {
        path: `chat-rooms/${this.channel}/messages`,
      },
      (data) => {
        callback(data as ChatMessage);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToPollReceived(callback: (poll: Poll) => void): () => void {
    const unsubscribe = listenToCollectionItemChange(
      {
        path: `polls`,
        where: [
          {
            fieldPath: 'chatRoomId',
            opStr: '==',
            value: this.channel,
          },
        ],
      },
      (data) => {
        callback(data as Poll);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToGroupMessageReceived(callback: (message: ChatMessage) => void): () => void {
    const unsubscribe = listenToCollectionItemChange(
      {
        path: `group-channels/${this.channel}/messages`,
      },
      (data) => {
        callback(data as ChatMessage);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public async sendReaction(reaction: ServerReaction): Promise<ServerReaction> {
    try {
      return (await addItem('reactions', reaction)) as ServerReaction;
    } catch (e) {
      throw new Error('failed');
    }
  }

  /**
   * @inheritdoc
   */
  public listenToUserReactions(user: ExternalUser, callback: (reactions: ServerReaction[]) => void): () => void {
    const unsubscribe = listenToCollectionChange(
      {
        path: 'reactions',
        where: [
          {
            fieldPath: 'userId',
            opStr: '==',
            value: user.id,
          },
          {
            fieldPath: 'chatRoomId',
            opStr: '==',
            value: this.channel,
          },
        ],
      },
      (response) => {
        callback(response as ServerReaction[]);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToUserChatPollsReactions(userId: string, callback: (reactions: ServerReaction[]) => void): () => void {
    const unsubscribe = listenToCollectionChange(
      {
        path: 'reactions',
        where: [
          {
            fieldPath: 'userId',
            opStr: '==',
            value: userId,
          },
          {
            fieldPath: 'eventId',
            opStr: '==',
            value: this.channel,
          },
          {
            fieldPath: 'itemType',
            opStr: '==',
            value: 'poll',
          },
        ],
      },
      (response) => {
        callback(response as ServerReaction[]);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToQnaUserReactions(
    userId: string,
    qnaId: string,
    callback: (reaction: ServerReaction[]) => void,
  ): () => void {
    const unsubscribe = listenToCollectionChange(
      {
        path: 'reactions',
        where: [
          {
            fieldPath: 'userId',
            opStr: '==',
            value: userId,
          },
          {
            fieldPath: 'qnaId',
            opStr: '==',
            value: qnaId,
          },
        ],
      },
      (response) => {
        callback(response as ServerReaction[]);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public async fetchQnaUserReactions(userId: string, qnaId: string): Promise<ServerReaction[]> {
    const reactions = await fetchCollectionItems({
      path: 'reactions',
      where: [
        {
          fieldPath: 'userId',
          opStr: '==',
          value: userId,
        },
        {
          fieldPath: 'qnaId',
          opStr: '==',
          value: qnaId,
        },
      ],
    });

    return reactions as ServerReaction[];
  }

  /**
   * @inheritdoc
   */
  public async fetchQnaProps(qnaId: string): Promise<QnaProps> {
    const qnaProps = (await fetchDocument({
      path: `qnas/${qnaId}`,
    })) as QnaProps;

    return qnaProps;
  }

  /**
   * @inheritdoc
   */
  public listenToQnaProps(qnaId: string, callback: (props: QnaProps) => void): () => void {
    const unsubscribe = listenToDocumentChange(
      {
        path: `qnas/${qnaId}`,
      },
      (response) => {
        callback(response as QnaProps);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToUserGroupChannels(user: ExternalUser, callback: (groupChannels: GroupChannel[]) => void): () => void {
    const unsubscribe = listenToCollectionChange(
      {
        path: 'group-channels',
        where: [
          {
            fieldPath: 'members',
            opStr: 'array-contains',
            value: user.id,
          },
        ],
      },
      (response) => {
        callback(response as GroupChannel[]);
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }
}
