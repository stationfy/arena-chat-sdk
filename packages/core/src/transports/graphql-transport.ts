import { GraphQLClient } from 'graphql-request';
import CoreConfig from '@arena-im/config-sdk';


export class GraphQLTransport {
  public client: GraphQLClient;

  public constructor(token: string, siteId: string, apiKey: string) {

    console.log('\n\n\n Core GraphQLTransport constructor check...')
    console.log(CoreConfig.enviroment)
    console.log('=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=\n\n\n')

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
