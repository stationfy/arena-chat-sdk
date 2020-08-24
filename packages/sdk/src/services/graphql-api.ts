import { GraphQLClient, gql } from 'graphql-request';
import { ExternalUser, PublicUser, GroupChannel } from '@arena-im/chat-types';
import { GraphQLTransport } from './graphql-transport';

export class GraphQLAPI {
  private client: GraphQLClient;

  public constructor(user: ExternalUser) {
    if (typeof user.token === 'undefined') {
      throw new Error('Cannot create a graphql client without user token');
    }

    const transport = new GraphQLTransport(user.token);

    this.client = transport.client;
  }

  public async fetchGroupChannels(): Promise<GroupChannel[]> {
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

    const data = await this.client.request(query);

    const me = data.me as PublicUser;

    if (!me.groupChannels) {
      return [];
    }

    return me.groupChannels;
  }
}
