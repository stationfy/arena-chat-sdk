import { GraphQLClient } from 'graphql-request';
import { GRAPHQL_ENDPOINT } from '../config';

export class GraphQLTransport {
  public client: GraphQLClient;

  public constructor(token: string, siteId: string, apiKey: string) {
    this.client = new GraphQLClient(GRAPHQL_ENDPOINT, {
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'ar-token': token,
        'ar-site-id': siteId,
      },
    });
  }

  public setToken(token: string): void {
    this.client.setHeader('ar-token', token);
  }
}
