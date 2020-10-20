import {
  ChatMessage,
  ChatMessageReport,
  BanUser,
  ProviderUser,
  ChatRoom,
  Site,
  Moderation,
  ExternalUser,
  EmbedSettings,
  TrackPayload,
} from '@arena-im/chat-types';

/** Rest api used to consume the rest services */
export interface BaseRest {
  /**
   * Send chat message
   *
   * @param message chat message
   */
  sendMessage(chatRoom: ChatRoom, message: ChatMessage): PromiseLike<ChatMessage>;

  /**
   * Report a chat message
   *
   * @param report report payload
   */
  reportMessage(chatRoom: ChatRoom, report: ChatMessageReport): PromiseLike<ChatMessageReport>;

  /** User request moderation role */
  requestModeration(site: Site, chatRoom: ChatRoom): PromiseLike<Moderation>;

  /**
   * Ban a user
   *
   * @param barUser User to be banned
   */
  banUser(banUser: BanUser): PromiseLike<void>;

  /**
   * Delete a chat message
   *
   * @param message Message to be deleted
   */
  deleteMessage(site: Site, chatRoom: ChatRoom, message: ChatMessage): PromiseLike<void>;

  /**
   * Load Chat Room
   *
   * @param siteSlug The current publisher's site
   * @param channel The chat room slug
   */
  loadChatRoom(
    siteSlug: string,
    channel: string,
  ): PromiseLike<{ chatRoom: ChatRoom; site: Site; settings: EmbedSettings }>;

  /**
   * Load Site
   *
   * @param {string} siteSlug
   */
  loadSite(siteSlug: string): PromiseLike<Site>;

  /**
   * Get Arena User - SSO Exchange
   * If the user doesn't exist create one otherwise return the user with informed id
   *
   * @param user user to be created or returned
   */
  getArenaUser(user: ProviderUser): PromiseLike<ExternalUser>;

  /**
   * Call Arena Hub
   *
   * @param trackObj
   */
  collect(trackObj: TrackPayload): PromiseLike<{ success: boolean }>;
}

export interface BaseRestOptions {
  authToken?: string;
  url?: string;
}
