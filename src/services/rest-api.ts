import { BaseRest, BaseRestOptions } from '../types/base-rest';
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
  private baseURL = 'https://api-dev.arena.im/v2';
  private transport: BaseTransport;

  public constructor(options?: BaseRestOptions) {
    const { url, authToken } = options || {};

    if (url) {
      this.baseURL = url;
    }

    if (supportsFetch()) {
      this.transport = new FetchTransport(this.baseURL, authToken);
    } else {
      this.transport = new XHRTransport(this.baseURL, authToken);
    }
  }

  /**
   * @inheritdoc
   */
  public sendMessage(chatRoom: ChatRoom, message: ChatMessage): PromiseLike<ChatMessage> {
    return this.transport.post<ChatMessage, ChatMessage>(`/data/chat-room/${chatRoom.id}`, message);
  }

  /**
   * @inheritdoc
   */
  public reportMessage(chatRoom: ChatRoom, report: ChatMessageReport): PromiseLike<ChatMessageReport> {
    return this.transport.post<ChatMessageReport, ChatMessageReport>(
      `/data/chat-room/${chatRoom.id}/report/${report.message.key}`,
      report,
    );
  }

  /**
   * @inheritdoc
   */
  public requestModeration(site: Site, chatRoom: ChatRoom): PromiseLike<void> {
    const request: ChatModerationRequest = {
      siteId: site._id,
      chatRoomId: chatRoom.id,
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
  public deleteMessage(site: Site, chatRoom: ChatRoom, message: ChatMessage): PromiseLike<void> {
    const request: DeleteChatMessageRequest = {
      data: {
        siteId: site._id,
      },
    };
    return this.transport.post<void, DeleteChatMessageRequest>(
      `/data/chat-room/${chatRoom.id}/messages/${message.key}`,
      request,
    );
  }

  /**
   * @inheritdoc
   */
  public loadChatRoom(siteSlug: string, channel: string): PromiseLike<{ chatRoom: ChatRoom; site: Site }> {
    return this.transport
      .get<{ chatInfo: ChatRoom; publisher: Site }>(`/chatroom/${siteSlug}/${channel}`)
      .then((cached) => {
        return {
          chatRoom: cached.chatInfo,
          site: cached.publisher,
        };
      });
  }
}
