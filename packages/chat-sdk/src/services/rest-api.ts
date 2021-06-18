import {
  ChatMessage,
  ChatMessageReport,
  DeleteChatMessageRequest,
  BanUser,
  ProviderUser,
  ChatRoom,
  ChatModerationRequest,
  Site,
  Moderation,
  ExternalUser,
  SSOExchangeResult,
  EmbedSettings,
  TrackPayload,
  ServerReaction,
  SendReactionResult,
} from '@arena-im/chat-types';
import { BaseRest, BaseRestOptions } from '../interfaces/base-rest';
import { supportsFetch } from '../utils/supports';
import { BaseTransport } from '../interfaces/base-transport';
import { FetchTransport } from './fetch-transport';
import { XHRTransport } from './xhr-transport';
import { API_V2_URL, CACHED_API, DEFAULT_AUTH_TOKEN } from '../config';
import { User } from '../auth/user';

/** Base rest class implementation */
export class RestAPI implements BaseRest {
  private static apiInstance: RestAPI;
  private static cachedInstance: RestAPI;
  private static apiNoauthInstance: RestAPI;

  private baseURL = API_V2_URL;
  private transport!: BaseTransport;

  private constructor(options?: BaseRestOptions) {
    const { url, authToken } = options || {};

    if (url) {
      this.baseURL = url;
    }

    this.setTransport(authToken);
    User.instance.onUserChanged(this.handleUserChange.bind(this));
  }

  private setTransport(authToken?: string) {
    if (supportsFetch()) {
      this.transport = new FetchTransport(this.baseURL, authToken);
    } else {
      this.transport = new XHRTransport(this.baseURL, authToken);
    }
  }

  /**
   *
   * @returns api v2 with authentication
   */
  public static getAPIInstance(): RestAPI {
    if (!RestAPI.apiInstance) {
      RestAPI.apiInstance = new RestAPI({ url: API_V2_URL, authToken: DEFAULT_AUTH_TOKEN });
    }

    return RestAPI.apiInstance;
  }

  private setAPIToken(token: string = DEFAULT_AUTH_TOKEN) {
    this.setTransport(token);
  }

  /**
   *
   * @returns cached api
   */
  public static getCachedInstance(): RestAPI {
    if (!RestAPI.cachedInstance) {
      RestAPI.cachedInstance = new RestAPI({ url: CACHED_API });
    }

    return RestAPI.cachedInstance;
  }

  /**
   *
   * @returns api v2 w/o authentication
   */
  public static getAPINoauthInstance(): RestAPI {
    if (!RestAPI.apiNoauthInstance) {
      RestAPI.apiNoauthInstance = new RestAPI({ url: API_V2_URL });
    }

    return RestAPI.apiNoauthInstance;
  }

  private handleUserChange(user: ExternalUser | null) {
    const token = user?.token;

    this.setAPIToken(token);
  }

  /**
   * @inheritdoc
   */
  public collect(trackObj: TrackPayload): PromiseLike<{ success: boolean }> {
    return this.transport.post<{ success: boolean }, TrackPayload>(`/collect`, trackObj);
  }

  /**
   * @inheritdoc
   */
  public sendMessage(chatRoom: ChatRoom, message: ChatMessage): PromiseLike<ChatMessage> {
    return this.transport.post<ChatMessage, ChatMessage>(`/data/chat-room/${chatRoom._id}`, message);
  }

  /**
   * @inheritdoc
   */
  public reportMessage(chatRoom: ChatRoom, report: ChatMessageReport): PromiseLike<ChatMessageReport> {
    return this.transport.post<ChatMessageReport, ChatMessageReport>(
      `/data/chat-room/${chatRoom._id}/report/${report.message.key}`,
      report,
    );
  }

  /**
   * @inheritdoc
   */
  public requestModeration(site: Site, chatRoom: ChatRoom): PromiseLike<Moderation> {
    const request: ChatModerationRequest = {
      siteId: site._id,
      chatRoomId: chatRoom._id,
    };

    return this.transport.post<Moderation, ChatModerationRequest>('/data/moderation/request-mod-status', request);
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
      siteId: site._id,
    };

    return this.transport.delete<DeleteChatMessageRequest>(
      `/data/chat-room/${chatRoom._id}/messages/${message.key}`,
      request,
    );
  }

  /**
   * @inheritdoc
   */
  public loadChatRoom(
    siteSlug: string,
    channel: string,
  ): PromiseLike<{ chatRoom: ChatRoom; site: Site; settings: EmbedSettings }> {
    return this.transport
      .get<{ chatInfo: ChatRoom; publisher: Site; settings: EmbedSettings }>(`/chatroom/${siteSlug}/${channel}`)
      .then((cached) => {
        return {
          chatRoom: cached.chatInfo,
          site: cached.publisher,
          settings: cached.settings,
        };
      });
  }

  /**
   *
   * @inheritdoc
   */
  public loadSite(siteSlug: string): PromiseLike<Site> {
    return this.transport.get<Site>(`/sites/${siteSlug}`).then((site) => {
      return site;
    });
  }

  /**
   * @inheritdoc
   */
  public getArenaUser(user: ProviderUser): PromiseLike<ExternalUser> {
    return this.transport.post<SSOExchangeResult, ProviderUser>('/profile/ssoexchange', user).then((data) => {
      const resultUser = data.data.user;
      const resultToken = data.data.token;

      const externalUser: ExternalUser = {
        id: resultUser._id,
        name: resultUser.name,
        image: resultUser.thumbnails.raw,
        email: resultUser.profile.email,
        token: resultToken,
        isModerator: resultUser.isModerator,
        isBanned: resultUser.isBanned,
      };

      return externalUser;
    });
  }

  /**
   * @inheritdoc
   */
  public sendReaction(reaction: ServerReaction): PromiseLike<string> {
    return this.transport.post<SendReactionResult, ServerReaction>('/data/reactions', reaction).then((data) => {
      return data.result;
    });
  }
}
