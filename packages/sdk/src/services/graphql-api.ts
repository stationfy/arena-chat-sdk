import { gql } from 'graphql-request';
import { ExternalUser, PublicUser, GroupChannel, Site } from '@arena-im/chat-types';
import { GraphQLTransport } from './graphql-transport';

export class GraphQLAPI {
  private graphQL: GraphQLTransport;

  public constructor(user: ExternalUser, site: Site) {
    if (typeof user.token === 'undefined') {
      throw new Error('Cannot create a graphql client without user token');
    }

    this.graphQL = new GraphQLTransport(user.token, site._id);
  }

  public async fetchGroupChannels(user?: ExternalUser): Promise<GroupChannel[]> {
    if (typeof user?.token !== 'undefined') {
      this.graphQL.setToken(user.token);
    }

    const query = gql`
      {
        me {
          groupChannels {
            _id
            createdAt
            image
            lastClearedTimestamp
            lastMessage {
              createdAt
              message {
                text
              }
            }
            lastReadTimestamp
            members {
              _id
              name
              image
            }
            name
            unreadCount
          }
        }
      }
    `;

    const data = await this.graphQL.client.request(query);

    const me = data.me as PublicUser;

    if (!me.groupChannels) {
      return [];
    }

    return me.groupChannels;
  }

  public async createGroupChannel(input: { userIds: string[]; siteId: string }): Promise<GroupChannel> {
    const mutation = gql`
      mutation createGroupChannel($input: CreateGroupChannelInput!) {
        createGroupChannel(input: $input) {
          _id
        }
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input });

    const groupChannel = data.createGroupChannel as GroupChannel;

    return groupChannel;
  }

  public async fetchMembers(chatId: string): Promise<PublicUser[]> {
    const query = gql`
      query chatRoom($id: ID!) {
        chatRoom(id: $id) {
          members {
            items {
              _id
              name
              status
              modLabel
              isModerator
              image
            }
          }
        }
      }
    `;

    const data = await this.graphQL.client.request(query, { id: chatId });

    const users = data.chatRoom.members as PublicUser[];

    return users;
  }
}
