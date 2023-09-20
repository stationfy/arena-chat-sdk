import { gql } from 'graphql-request';
import { ExternalUser, Site, Status } from '@arena-im/chat-types';
import { GraphQLTransport } from '../transports';
import { User, UserObservable } from '../auth';
import { OrganizationSite } from '../organization';
import { CoreConfig } from '../config';

export class GraphQLAPI {
  private static graphQLAPIInstance: Promise<GraphQLAPI> | undefined;
  private transport: GraphQLTransport;
  private default_auth_token: string = CoreConfig.enviroment?.DEFAULT_AUTH_TOKEN || '';

  private constructor(site: Site) {
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

  public async pollVote({
    pollId,
    userId,
    optionId,
  }: {
    pollId: string;
    userId: string;
    optionId: number;
  }): Promise<boolean> {
    const mutation = gql`
      mutation pollVote($input: PollVoteInput!) {
        pollVote(input: $input)
      }
    `;
    const data = await this.transport.client.request(mutation, { input: { pollId, userId, optionId } });

    const result = data.pollVote as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  /**
   * Remove a message reaction
   *
   * @param userId User id
   * @param itemId ChatMessage id
   * @param reaction reaction type
   */
  public async deleteReaction(userId: string, itemId: string, reaction: string): Promise<boolean> {
    const mutation = gql`
      mutation deleteReaction($input: DeleteReactionInput!) {
        deleteReaction(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { userId, itemId, reaction } });

    const result = data.deleteReaction as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }
}
