import { GraphQLClient } from 'graphql-request';

const ENDPOINT = 'https://vvfkuo3y7zecvapitevg4h7h6i.appsync-api.us-west-2.amazonaws.com/graphql';

export class GraphQLTransport {
  public client: GraphQLClient;

  public constructor(token: string, siteId: string, apiKey: string) {
    this.client = new GraphQLClient(ENDPOINT, {
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
