import { GraphQLClient } from 'graphql-request';

const ENDPOINT = 'https://faker.graphqleditor.com/arenaim/live-chat/graphql';

export class GraphQLTransport {
  public client: GraphQLClient;

  public constructor(token: string) {
    this.client = new GraphQLClient(ENDPOINT, {
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
  }
}
