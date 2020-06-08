import { BaseRest } from '../types/base-rest';
import { ChatMessage, ChatMessageReport, DeleteChatMessageRequest } from '../types/chat-message';
import { BanUser } from '../types/user';
import { supportsFetch } from '../utils/supports';
import { BaseTransport } from '../types/base-transport';
import { ChatRoom, ChatModerationRequest } from '../types/chat-room';
import { Site } from '../types/site';
import { FetchTransport } from './fetch-transport';
import { XHRTransport } from './xhr-transport';

/** Base rest class implementation */
export class RestAPI implements BaseRest {
  private transport: BaseTransport;

  public constructor(private chatRoom: ChatRoom, private site: Site) {
    if (supportsFetch()) {
      this.transport = new FetchTransport('1234');
    } else {
      this.transport = new XHRTransport('1234');
    }
  }

  /**
   * @inheritdoc
   */
  public sendMessage(message: ChatMessage): PromiseLike<ChatMessage> {
    return this.transport.post<ChatMessage, ChatMessage>(`/data/chat-room/${this.chatRoom.id}`, message);
  }

  /**
   * @inheritdoc
   */
  public reportMessage(report: ChatMessageReport): PromiseLike<ChatMessageReport> {
    return this.transport.post<ChatMessageReport, ChatMessageReport>(
      `/data/chat-room/${this.chatRoom.id}/report/${report.message.key}`,
      report,
    );
  }

  /**
   * @inheritdoc
   */
  public requestModeration(): PromiseLike<void> {
    const request: ChatModerationRequest = {
      siteId: this.site.id,
      chatRoomId: this.chatRoom.id,
    };

    return this.transport.post<void, ChatModerationRequest>('/data/moderation/request-mod-status', request);
  }

  /**
   * @inheritdoc
   */
  public banUser(banUser: BanUser): PromiseLike<void> {
    return this.transport.post<void, BanUser>('/data/moderation/ban-user', banUser);
  }

  /**
   * @inheritdoc
   */
  public deleteMessage(message: ChatMessage): PromiseLike<void> {
    const request: DeleteChatMessageRequest = {
      data: {
        siteId: this.site.id,
      },
    };
    return this.transport.post<void, DeleteChatMessageRequest>(
      `/data/chat-room/${this.chatRoom.id}/messages/${message.key}`,
      request,
    );
  }
}
