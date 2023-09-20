import {
  ChatRoom,
  LiveChatChannel,
  PublicUser,
  Status,
  BaseLiveChat,
  BaseChannel,
  PageRequest,
  PresenceInfo,
  PresenceUser,
} from '@arena-im/chat-types';
import { Credentials, PresenceAPI, ArenaHub } from '@arena-im/core';
import { GraphQLAPI } from '../services/graphql-api';
import { Channel } from '../channel/channel';
import { RestAPI } from '../services/rest-api';
import { Config } from '../config';

type Instance = {
  [key: string]: Promise<LiveChat>;
};

export class LiveChat implements BaseLiveChat {
  private static instance: Instance = {};
  private presenceAPI!: PresenceAPI;
  private channelDataCachePromiseMap = new Map<string, Promise<LiveChatChannel>>();

  private constructor(private readonly chatRoom: ChatRoom) {
    this.trackPageView(chatRoom);
    this.initPresence(chatRoom.siteId);
  }

  private initPresence(siteId: string) {
    this.presenceAPI = PresenceAPI.getInstance(siteId, this.chatRoom._id, 'chat_room');
    this.presenceAPI.joinUser();
  }

  public static getInstance(slug: string): Promise<LiveChat> {
    if (!LiveChat.instance[slug]) {
      LiveChat.instance[slug] = this.fetchChatRoom(slug).then((chatRoom) => {
        if (chatRoom === null) {
          throw new Error('Cannot load chat instance.');
        }

        return new LiveChat(chatRoom);
      });
    }

    return LiveChat.instance[slug];
  }

  private static async fetchChatRoom(chatSlug: string): Promise<ChatRoom | null> {
    const restAPI = RestAPI.getCachedInstance();

    const response = await restAPI.loadChatRoom(Credentials.apiKey, chatSlug);

    if (response === null) {
      return null;
    }

    return response.chatRoom;
  }

  private async trackPageView(chatRoom: ChatRoom) {
    if (this.detectWidgetsPresence()) {
      return;
    }

    const arenaHub = ArenaHub.getInstance(chatRoom);
    arenaHub.trackPage();
  }

  /**
   * Verify if there are some Arena widgets
   */
  private detectWidgetsPresence() {
    const arenaLive = document.querySelector('#arena-live');
    const arenaChat = document.querySelector('#arena-chat');
    const arenaLiveClass = document.querySelector('.arena-liveblog');
    const arenaChatClass = document.querySelector('.arena-chat');
    const arenaWidgetClass = document.querySelector('.arena-embed-widget');
    const arenaPreviewWidgetClass = document.querySelector('.arena-home-app');
    const arenaEmbedFrameWidgetClass = document.querySelector('.arena-embed-frame');

    return (
      !!arenaLive ||
      !!arenaChat ||
      !!arenaLiveClass ||
      !!arenaChatClass ||
      !!arenaWidgetClass ||
      !!arenaPreviewWidgetClass ||
      !!arenaEmbedFrameWidgetClass
    );
  }

  public async getChannels(): Promise<LiveChatChannel[]> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const channels = await graphQLAPI.listChannels(this.chatRoom._id);

      return channels;
    } catch (e) {
      throw new Error(`Cannot get channels on "${this.chatRoom.slug}" live chat.`);
    }
  }

  /**
   * Get the main chat room channel
   */
  public getMainChannel(): Channel {
    console.log('getMainChannel')
    console.log(Config.enviroment)
    console.log('=-=-=-=-=-=-=-=-=-=-=-=')
    try {
      if (!this.chatRoom.mainChannel) {
        throw new Error(Status.Invalid);
      }

      const channel = this.chatRoom.mainChannel;

      const channelI = Channel.getInstance(channel, this.chatRoom);

      return channelI;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid main channel.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async getChannelData(channelId: string): Promise<LiveChatChannel> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;

      if (this.channelDataCachePromiseMap.has(channelId)) {
        return this.channelDataCachePromiseMap.get(channelId)!;
      }

      const channelPromise = graphQLAPI.fetchChannel(channelId);

      this.channelDataCachePromiseMap.set(channelId, channelPromise)
      
      return channelPromise;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid channel (${channelId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  /**
   * Get a specific channel by id
   *
   * @param channelId
   */
  public async getChannel(channelId: string): Promise<BaseChannel> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;

      let channelPromise: Promise<LiveChatChannel>;
      
      if (this.channelDataCachePromiseMap.has(channelId)) {
        channelPromise = this.channelDataCachePromiseMap.get(channelId)!;
      } else {
        channelPromise = graphQLAPI.fetchChannel(channelId);
        this.channelDataCachePromiseMap.set(channelId, channelPromise);
      }

      const channel = await channelPromise;

      const channelI = Channel.getInstance(channel, this.chatRoom);

      return channelI;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid channel (${channelId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async getTotalAnonymousUser(isOnline?: boolean): Promise<number> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const total = await graphQLAPI.fetchTotalAnonymousUsers(this.chatRoom._id, isOnline);

      return total;
    } catch (e) {
      throw new Error(`Cannot fetch total anonymous user on "${this.chatRoom.slug}" chat.`);
    }
  }

  /**
   * Get all online and offline chat members
   */
  public async getMembers(page: PageRequest, searchTerm: string): Promise<PublicUser[]> {
    try {
      const { GraphQLAPI } = await import('../services/graphql-api');

      const graphQLAPI = await GraphQLAPI.instance;

      const members = await graphQLAPI.fetchMembers(this.chatRoom._id, page, searchTerm);

      return members;
    } catch (e) {
      throw new Error(`Cannot fetch chat members messages on "${this.chatRoom.slug}" channel.`);
    }
  }

  public async fetchUserReminderSubscription(reminderId: string): Promise<boolean> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;

      const isSubscribedToReminder = await graphQLAPI.fetchUserReminderSubscription(reminderId);

      return isSubscribedToReminder;
    } catch (e) {
      throw new Error(`Cannot fetch user reminder subscription for this reminder: "${reminderId}".`);
    }
  }

  public async subscribeUserToReminder(reminderId: string, url: string): Promise<boolean> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;

      const subscribedUserToReminder = await graphQLAPI.subscribeUserToReminder(reminderId, url);

      return subscribedUserToReminder;
    } catch (e) {
      throw new Error(`Cannot subscribe user to reminder for this reminder: "${reminderId}".`);
    }
  }

  public async unsubscribeUserToReminder(reminderId: string): Promise<boolean> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;

      const unsubscribedUserToReminder = await graphQLAPI.unsubscribeUserToReminder(reminderId);

      return unsubscribedUserToReminder;
    } catch (e) {
      throw new Error(`Cannot unsubscribe user to reminder for this reminder: "${reminderId}".`);
    }
  }

  /**
   * Remove all chat's listeners
   *
   */
  public offAllListeners(): void {
    this.presenceAPI.offAllListeners();
  }

  public getUserList(): Promise<PresenceUser[]> {
    return this.presenceAPI.getAllOnlineUsers();
  }

  public watchOnlineCount(callback: (onlineCount: number) => void): () => void {
    return this.presenceAPI.watchOnlineCount(callback);
  }

  public watchPresenceInfo(callback: (presenceInfo: PresenceInfo) => void): () => void {
    return this.presenceAPI.watchPresenceInfo(callback);
  }

  public watchUserJoined(callback: (user: PresenceUser) => void): () => void {
    return this.presenceAPI.watchUserJoined(callback);
  }

  public watchUserLeft(callback: (user: PresenceUser) => void): () => void {
    return this.presenceAPI.watchUserLeft(callback);
  }
}
