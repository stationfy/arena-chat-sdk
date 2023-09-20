import { GraphQLClient } from 'graphql-request';
import { CoreConfig } from '../config';

export class GraphQLTransport {
  public client: GraphQLClient;

  public constructor(token: string, siteId: string, apiKey: string) {
    this.client = new GraphQLClient(CoreConfig.enviroment?.GRAPHQL_ENDPOINT || '', {
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'ar-token': token,
        'ar-site-id': siteId,
      },
    });
  }

  /**
   * Set user token
   * @param token
   */
  public setToken(token: string): void {
    this.client.setHeader('ar-token', token);
  }
}
