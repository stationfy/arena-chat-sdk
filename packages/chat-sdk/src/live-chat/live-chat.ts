import {
  ChatRoom,
  LiveChatChannel,
  PublicUser,
  Status,
  BaseLiveChat,
  BaseChannel,
  PageRequest
} from '@arena-im/chat-types';
import { Credentials } from '@arena-im/core';
import { GraphQLAPI } from '../services/graphql-api';
import { Channel } from '../channel/channel';
import { RestAPI } from '../services/rest-api';

export class LiveChat implements BaseLiveChat {
  private static instance: Promise<LiveChat>;

  private constructor(private readonly chatRoom: ChatRoom) {
    this.trackPageView(chatRoom);
  }

  public static getInstance(slug: string): Promise<LiveChat> {
    if (!LiveChat.instance) {
      LiveChat.instance = this.fetchChatRoom(slug).then((chatRoom) => {
        return new LiveChat(chatRoom);
      });
    }

    return LiveChat.instance;
  }

  private static async fetchChatRoom(chatSlug: string): Promise<ChatRoom> {
    const restAPI = RestAPI.getCachedInstance();

    const { chatRoom } = await restAPI.loadChatRoom(Credentials.apiKey, chatSlug);

    return chatRoom;
  }

  private async trackPageView(chatRoom: ChatRoom) {
    if (this.detectWidgetsPresence()) {
      return;
    }

    const { ArenaHub } = await import('../services/arena-hub');
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
      const channel = await graphQLAPI.fetchChannel(channelId);

      return channel;
    } catch (e: unknown) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e instanceof Error && e.message === Status.Invalid) {
        erroMessage = `Invalid channel (${channelId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  /**
   * Get an specific channel by id
   *
   * @param channelId
   */
  public async getChannel(channelId: string): Promise<BaseChannel> {
    try {
      const graphQLAPI = await GraphQLAPI.instance;
      const channel = await graphQLAPI.fetchChannel(channelId);

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
}
