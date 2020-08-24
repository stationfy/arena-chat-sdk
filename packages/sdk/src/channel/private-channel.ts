import { GraphQLAPI } from '../services/graphql-api';
import { ExternalUser, GroupChannel } from '@arena-im/chat-types';

export class PrivateChannel {
  private graphQLAPI: GraphQLAPI;

  public constructor(user: ExternalUser) {
    this.graphQLAPI = new GraphQLAPI(user);
  }

  public getUserChannels(): Promise<GroupChannel[]> {
    return this.graphQLAPI.fetchGroupChannels();
  }
}
