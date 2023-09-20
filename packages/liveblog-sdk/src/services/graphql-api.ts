import { ExternalUser, Site } from '@arena-im/chat-types';
import { GraphQLTransport, User, UserObservable, OrganizationSite } from '@arena-im/core';
import  LiveConfig from '@arena-im/config-sdk';

export class GraphQLAPI {
  private static graphQLAPIInstance: Promise<GraphQLAPI> | undefined;
  private transport: GraphQLTransport;
  private default_auth_token: string;

  private constructor(site: Site) {
    this.default_auth_token = LiveConfig.enviroment?.DEFAULT_AUTH_TOKEN || '';

    const user = User.instance.data;

    this.transport = new GraphQLTransport(user?.token || this.default_auth_token, site._id, site.settings.graphqlPubApiKey);

    UserObservable.instance.onUserChanged(this.handleUserChange.bind(this));
  }

  public static get instance(): Promise<GraphQLAPI> {
    if (!GraphQLAPI.graphQLAPIInstance) {
      GraphQLAPI.graphQLAPIInstance = OrganizationSite.instance.getSite().then((site) => {
        return new GraphQLAPI(site);
      });
    }

    return GraphQLAPI.graphQLAPIInstance;
  }

  public static cleanInstance(): void {
    GraphQLAPI.graphQLAPIInstance = undefined;
  }

  private handleUserChange(user: ExternalUser | null) {
    const token = user?.token || this.default_auth_token;

    this.transport.setToken(token);
  }
}
