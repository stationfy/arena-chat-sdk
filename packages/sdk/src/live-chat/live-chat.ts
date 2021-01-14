import {
  ChatRoom,
  ExternalUser,
  LiveChatChannel,
  PublicUser,
  Site,
  Status,
  BaseLiveChat,
  BaseChannel,
} from '@arena-im/chat-types';
import { GraphQLAPI } from '../services/graphql-api';
import { ArenaChat } from '../sdk';
import { Channel } from '../channel/channel';
import { ArenaHub } from '../services/arena-hub';

export class LiveChat implements BaseLiveChat {
  private arenaHub: ArenaHub;
  private graphQLAPI: GraphQLAPI;

  public constructor(private chatRoom: ChatRoom, site: Site, private sdk: ArenaChat) {
    let currentUser: ExternalUser | undefined;

    if (this.sdk.user) {
      currentUser = this.sdk.user;
    }

    this.graphQLAPI = new GraphQLAPI(site, currentUser);

    this.sdk.onUserChanged((user: ExternalUser | null) => this.watchUserChanged(user));

    this.arenaHub = new ArenaHub(chatRoom, sdk);

    if (!this.detectWidgetsPresence()) {
      this.arenaHub.track('page');
    }
  }

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

  /**
   * Watch user changed
   *
   * @param {ExternalUser} user external user
   */
  private watchUserChanged(user: ExternalUser | null) {
    if (this.sdk.site) {
      this.graphQLAPI = new GraphQLAPI(this.sdk.site, user || undefined);
    }
  }

  public async getChannels(): Promise<LiveChatChannel[]> {
    try {
      const channels = await this.graphQLAPI.listChannels(this.chatRoom._id);

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

      const channelI = new Channel(channel, this.chatRoom, this.sdk);

      return channelI;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e.message === Status.Invalid) {
        erroMessage = `Invalid main channel.`;
      }

      throw new Error(erroMessage);
    }
  }

  public async getChannelData(channelId: string): Promise<LiveChatChannel> {
    try {
      const channel = await this.graphQLAPI.fetchChannel(channelId);

      return channel;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e.message === Status.Invalid) {
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
      const channel = await this.graphQLAPI.fetchChannel(channelId);

      const channelI = new Channel(channel, this.chatRoom, this.sdk);

      return channelI;
    } catch (e) {
      let erroMessage = 'Internal Server Error. Contact the Arena support team.';

      if (e.message === Status.Invalid) {
        erroMessage = `Invalid channel (${channelId}) id.`;
      }

      throw new Error(erroMessage);
    }
  }

  /**
   * Get all online and offline chat members
   */
  public async getMembers(): Promise<PublicUser[]> {
    if (this.sdk.site === null) {
      throw new Error('Cannot get chat members without a site id');
    }

    let user;
    if (this.sdk.user !== null) {
      user = this.sdk.user;
    }

    try {
      const { GraphQLAPI } = await import('../services/graphql-api');

      const graphQLAPI = new GraphQLAPI(this.sdk.site, user);

      const members = await graphQLAPI.fetchMembers(this.chatRoom._id);

      return members;
    } catch (e) {
      throw new Error(`Cannot fetch chat members messages on "${this.chatRoom.slug}" channel.`);
    }
  }
}
