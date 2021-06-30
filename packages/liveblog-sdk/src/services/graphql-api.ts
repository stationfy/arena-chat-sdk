import { ExternalUser, Site } from '@arena-im/chat-types';
import { GraphQLTransport, User, UserObservable, OrganizationSite } from '@arena-im/core';
import { DEFAULT_AUTH_TOKEN } from '../config';

export class GraphQLAPI {
  private static graphQLAPIInstance: Promise<GraphQLAPI> | undefined;
  private transport: GraphQLTransport;

  private constructor(site: Site) {
    const user = User.instance.data;

    this.transport = new GraphQLTransport(user?.token || DEFAULT_AUTH_TOKEN, site._id, site.settings.graphqlPubApiKey);

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
    const token = user?.token || DEFAULT_AUTH_TOKEN;

    this.transport.setToken(token);
  }
}
