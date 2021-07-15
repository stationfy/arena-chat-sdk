import { ExternalUser, ServerReaction, ChannelReaction } from '../../../types/dist';
import { WebSocketTransport } from '../transports/websocket-transport';

type EmitJoin = {
  channelId: string;
  siteId: string;
  user: Partial<ExternalUser>;
  channelType: 'liveblog' | 'chat_room'
};

type EmitEvents = {
  'reaction.create': (reaction: ServerReaction) => void;
  join: (join: EmitJoin) => void;
};

type ListenEvents = {
  'reaction.user': (reactions: ServerReaction[]) => void;
  'reaction.channel': (reactions: ChannelReaction[]) => void;
};

type Instance = {
  [key: string]: ReactionsAPI
}

export class ReactionsAPI {
  static instance: Instance = {}
  private wsTransport: WebSocketTransport<ListenEvents, EmitEvents>;

  public constructor() {
    this.wsTransport = new WebSocketTransport();
  }

  static getInstance(channelId: string) {
    if(!this.instance[channelId]) {
      this.instance[channelId] = new ReactionsAPI()
    }

    return this.instance[channelId]
  }

  public createReaction(reaction: ServerReaction) {
    this.wsTransport.client.emit('reaction.create', reaction);
  }

  public watchUserReactions(callback: (reactions: ServerReaction[]) => void) {
    this.wsTransport.client.on('reaction.user', callback);
  }

  public watchChannelReactions(callback: (reactions: ChannelReaction[]) => void) {
    this.wsTransport.client.on('reaction.channel', callback);
  }
}
