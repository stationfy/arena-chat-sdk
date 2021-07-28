import {
  ChatMessage,
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
  LiveChatChannel,
} from '@arena-im/chat-types';
import { FirestoreAPI, BaseRealtime } from '@arena-im/core';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtime {
  private static instance: RealtimeAPI;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private constructor() {}

  /** Unsubscribe functions */
  private unsbscribeFunctions: (() => void)[] = [];

  public static getInstance(): RealtimeAPI {
    if (!RealtimeAPI.instance) {
      RealtimeAPI.instance = new RealtimeAPI();
    }

    return RealtimeAPI.instance;
  }

  /**
   * @inheritDoc
   */
  public async fetchAllQnaQuestions(qnaId: string, limit?: number, filter?: QnaQuestionFilter): Promise<QnaQuestion[]> {
    let orderBy: OrderBy = {
      field: 'createdAt',
      desc: true,
    };
    let where: Where = {
      fieldPath: '',
      opStr: '',
      value: '',
    };

    if (filter === QnaQuestionFilter.POPULAR) {
      orderBy = {
        field: 'upvotes',
        desc: true,
      };
    } else if (filter === QnaQuestionFilter.ANSWERED) {
      where = {
        fieldPath: 'isAnswered',
        opStr: '==',
        value: true,
      };
    } else if (filter === QnaQuestionFilter.NOT_ANSWERED) {
      where = {
        fieldPath: 'isAnswered',
        opStr: '==',
        value: false,
      };
    }

    const config: ListenChangeConfig = {
      path: `qnas/${qnaId}/questions`,
      orderBy: [orderBy],
      limit,
    };

    if (where.fieldPath.length > 0) {
      config.where = [where];
    }

    const questions = await FirestoreAPI.fetchCollectionItems(config);

    return questions as QnaQuestion[];
  }

  /**
   * @inheritdoc
   */
  public async fetchAllPolls(channelId: string, filter?: PollFilter, limit?: number): Promise<Poll[]> {
    let orderBy: OrderBy;
    const where: Where[] = [
      {
        fieldPath: 'channelId',
        opStr: '==',
        value: channelId,
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

    const polls = await FirestoreAPI.fetchCollectionItems(config);

    return polls as Poll[];
  }

  /**
   * @inheritDoc
   */
  public listenToMessage(channelId: string, callback: (messages: ChatMessage[]) => void, limit?: number): void {
    const unsubscribe = FirestoreAPI.listenToCollectionChange(
      {
        path: `chat-rooms/${channelId}/messages`,
        limit,
      },
      (response) => {
        const messages: ChatMessage[] = response.map((messageData: Partial<ChatMessage>) => ({
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
  public listenToChatConfigChanges(path: string, callback: (channel: LiveChatChannel) => void): () => void {
    const unsubscribe = FirestoreAPI.listenToDocumentChange(path, (data) => {
      const channel: LiveChatChannel = data as LiveChatChannel;

      callback(channel);
    });
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
  public async fetchRecentMessages(dataPath: string, limit?: number): Promise<ChatMessage[]> {
    if (!dataPath) {
      throw new Error('failed');
    }

    const config: ListenChangeConfig = {
      path: `${dataPath}/messages`,
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

  /**
   * @inheritdoc
   */
  public async fetchGroupRecentMessages(
    channelId: string,
    limit?: number,
    lastClearedTimestamp?: number,
  ): Promise<ChatMessage[]> {
    const config: ListenChangeConfig = {
      path: `group-channels/${channelId}/messages`,
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

    const messages = await FirestoreAPI.fetchCollectionItems(config);

    return messages.reverse() as ChatMessage[];
  }

  /**
   * @inheritdoc
   */
  public async fetchPreviousMessages(
    dataPath: string,
    firstMessage: ChatMessage,
    limit?: number,
  ): Promise<ChatMessage[]> {
    if (!dataPath) {
      throw new Error('failed');
    }

    if (limit) {
      limit = limit + 1;
    }

    const messages = await FirestoreAPI.fetchCollectionItems({
      path: `${dataPath}/messages`,
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
    channelId: string,
    firstMessage: ChatMessage,
    lastClearedTimestamp?: number,
    limit?: number,
  ): Promise<ChatMessage[]> {
    if (limit) {
      limit = limit + 1;
    }

    const config: ListenChangeConfig = {
      path: `group-channels/${channelId}/messages`,
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

    const messages = await FirestoreAPI.fetchCollectionItems(config);

    messages.reverse();

    messages.pop();

    return messages as ChatMessage[];
  }

  public listenToQuestionReceived(channelId: string, callback: (message: QnaQuestion) => void): () => void {
    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `qnas/${channelId}/questions`,
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
  public listenToMessageReceived(dataPath: string, callback: (message: ChatMessage) => void): () => void {
    if (!dataPath) {
      throw new Error('failed');
    }

    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `${dataPath}/messages`,
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
  public listenToPollReceived(channelId: string, callback: (poll: Poll) => void): () => void {
    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `polls`,
        where: [
          {
            fieldPath: 'channelId',
            opStr: '==',
            value: channelId,
          },
          {
            fieldPath: 'draft',
            opStr: '==',
            value: false,
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
  public listenToGroupMessageReceived(channelId: string, callback: (message: ChatMessage) => void): () => void {
    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `group-channels/${channelId}/messages`,
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
      return (await FirestoreAPI.addItem('reactions', reaction)) as ServerReaction;
    } catch (e) {
      throw new Error('failed');
    }
  }

  /**
   * @inheritdoc
   */
  public listenToUserReactionsOld(
    channelId: string,
    user: ExternalUser,
    callback: (reactions: ServerReaction[]) => void,
  ): () => void {
    const unsubscribe = FirestoreAPI.listenToCollectionChange(
      {
        path: 'reactions',
        where: [
          {
            fieldPath: 'userId',
            opStr: '==',
            value: user.id,
          },
          {
            fieldPath: 'openChannelId',
            opStr: '==',
            value: channelId,
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
  public listenToUserChatPollsReactions(
    channelId: string,
    userId: string,
    callback: (reactions: ServerReaction[]) => void,
  ): () => void {
    const unsubscribe = FirestoreAPI.listenToCollectionChange(
      {
        path: 'reactions',
        where: [
          {
            fieldPath: 'userId',
            opStr: '==',
            value: userId,
          },
          {
            fieldPath: 'channelId',
            opStr: '==',
            value: channelId,
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
    const unsubscribe = FirestoreAPI.listenToCollectionChange(
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
    const reactions = await FirestoreAPI.fetchCollectionItems({
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
    const qnaProps = (await FirestoreAPI.fetchDocument(`qnas/${qnaId}`)) as QnaProps;

    return qnaProps;
  }

  /**
   * @inheritdoc
   */
  public listenToQnaProps(qnaId: string, callback: (props: QnaProps) => void): () => void {
    const unsubscribe = FirestoreAPI.listenToDocumentChange(`qnas/${qnaId}`, (response) => {
      callback(response as QnaProps);
    });

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToUserGroupChannels(user: ExternalUser, callback: (groupChannels: GroupChannel[]) => void): () => void {
    const unsubscribe = FirestoreAPI.listenToCollectionChange(
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
