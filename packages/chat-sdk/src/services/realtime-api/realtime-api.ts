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
import { FirestoreAPI } from '@arena-im/core';
import { Logger } from '@arena-im/core';
import { RealtimeApiWS } from './realtime-api-ws';
import { BaseRealtimeAPI } from '@arena-im/chat-types';
import { RealtimeApiFirestore } from './realtime-api-firestore';
import { Subject } from 'rxjs';
import { Site } from '../../../../types/esm/site';

/** Base realtime class implementation */
export class RealtimeAPI implements BaseRealtimeAPI {
  private static instances: { [key: string]: RealtimeAPI } = {};
  private realtimeApiStrategy: BaseRealtimeAPI = new RealtimeApiFirestore(this.dataPath);
  private realtimeStrategyChanged$: Subject<string> = new Subject();

  constructor(
    private readonly chatroomId: string,
    private readonly channelId: string,
    private readonly dataPath: string,
    private readonly site?: Site,
  ) {
      this.realtimeApiStrategy = this.defineStrategy();
  }

  public on(type: 'change', callback: (value: any) => void): () => void {
    let observable: Subject<any> | undefined;

    switch (type) {
      case 'change':
        observable = this.realtimeStrategyChanged$;
        break;
    }

    if (observable) {
      observable.subscribe(callback);
    }

    return observable.unsubscribe;
  }

  private defineStrategy(): BaseRealtimeAPI {
    this.close();
    if (this.site?.featureFlags?.['chat_fireproxy']?.status === 'active') {
      return new RealtimeApiWS(this.chatroomId, this.channelId, this.fallback.bind(this));
    } else {
      return new RealtimeApiFirestore(this.dataPath);
    }
  }

  private async fallback(): Promise<void> {
    Logger.instance.log('error', 'LiveblogServices: Starting Arena WS Fallback');
    this.realtimeApiStrategy = new RealtimeApiFirestore(this.dataPath);
  }

  /** Unsubscribe functions */
  private unsbscribeFunctions: (() => void)[] = [];

  public static getInstance(chatroomId: string, channelId: string, dataPath: string, site?: Site): RealtimeAPI {
    if (!RealtimeAPI.instances[chatroomId]) {
      RealtimeAPI.instances[chatroomId] = new RealtimeAPI(chatroomId, channelId, dataPath, site);
    }

    return RealtimeAPI.instances[chatroomId];
  }

  public close(): void {
    if (this.realtimeApiStrategy) {
      return this.realtimeApiStrategy.close();
    }
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
      limit: limit ?? 100,
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
      limit: limit ?? 100,
      where,
    };

    const polls = await FirestoreAPI.fetchCollectionItems(config);

    return polls as Poll[];
  }

  /**
   * @inheritDoc
   */
  public listenToMessage(callback: (message: ChatMessage) => void): () => void {
    return this.realtimeApiStrategy.listenToMessage(callback);
  }

  /**
   * @inheritdoc
   */
  public listenToBannedUsers(): void {
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
  public async fetchRecentMessages(limit: number): Promise<ChatMessage[]> {
    return this.realtimeApiStrategy.fetchRecentMessages(limit);
  }

  /**
   * @inheritdoc
   */
  public async fetchPreviousMessages(limit: number, before: number): Promise<ChatMessage[]> {
    return this.realtimeApiStrategy.fetchPreviousMessages(limit, before);
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
        limit: 100,
      },
      (changes) => {
        for (const change of changes) {
          const data = change.doc.data();

          data.changeType = change.type;

          callback(data as QnaQuestion);
        }
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToMessageReceived(
    dataPath: string,
    callback: (message: ChatMessage) => void,
    callbackInitialMessages?: (messages: ChatMessage[]) => void,
    limit?: number,
  ): () => void {
    if (!dataPath) {
      throw new Error('failed');
    }

    let initialData = true;

    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `${dataPath}/messages`,
        orderBy: [
          {
            field: 'createdAt',
            desc: true,
          },
        ],
        limit,
      },
      (changes) => {
        if (initialData) {
          initialData = false;
          let messages: ChatMessage[] = [];

          for (const change of changes) {
            const data = change.doc.data();

            data.changeType = change.type;

            messages.push(data as ChatMessage);
          }

          messages = messages.reverse();

          if (callbackInitialMessages) {
            callbackInitialMessages(messages);
          }
        } else {
          for (const change of changes) {
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

  /**
   * @inheritdoc
   */
  public listenToPollReceived(
    channelId: string,
    callback: (poll: Poll) => void,
    callbackInitialPolls?: (polls: Poll[]) => void,
    limit?: number,
  ): () => void {
    let initialData = true;

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
        limit: limit ?? 100,
      },
      (changes) => {
        if (initialData) {
          initialData = false;
          const polls: Poll[] = [];

          for (const change of changes) {
            const data = change.doc.data();

            data.changeType = change.type;

            polls.push(data as Poll);
          }

          if (callbackInitialPolls) {
            callbackInitialPolls(polls);
          }
        } else {
          for (const change of changes) {
            const data = change.doc.data();
            data.changeType = change.type;

            callback(data as Poll);
          }
        }

        for (const change of changes) {
          const data = change.doc.data();

          data.changeType = change.type;

          callback(data as Poll);
        }
      },
    );

    this.unsbscribeFunctions.push(unsubscribe);

    return unsubscribe;
  }

  /**
   * @inheritdoc
   */
  public listenToGroupMessageReceived(
    channelId: string,
    callback: (message: ChatMessage) => void,
    callbackInitialMessages?: (messages: ChatMessage[]) => void,
    limit?: number,
  ): () => void {
    let initialData = true;

    const unsubscribe = FirestoreAPI.listenToCollectionItemChange(
      {
        path: `group-channels/${channelId}/messages`,
        orderBy: [
          {
            field: 'createdAt',
            desc: true,
          },
        ],
        limit,
      },
      (changes) => {
        if (initialData) {
          initialData = false;
          let messages: ChatMessage[] = [];

          for (const change of changes) {
            const data = change.doc.data();

            data.changeType = change.type;

            messages.push(data as ChatMessage);
          }

          messages = messages.reverse();

          if (callbackInitialMessages) {
            callbackInitialMessages(messages);
          }
        } else {
          for (const change of changes) {
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
        limit: 100,
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
