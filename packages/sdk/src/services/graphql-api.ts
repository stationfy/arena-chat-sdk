import { gql } from 'graphql-request';
import { ExternalUser, PublicUser, GroupChannel, Site, ChatMessageContent } from '@arena-im/chat-types';
import { GraphQLTransport } from './graphql-transport';
import { DEFAULT_AUTH_TOKEN } from '../config';
import { PrivateMessageInput } from '@arena-im/chat-types/dist/private-chat';

export class GraphQLAPI {
  private graphQL: GraphQLTransport;

  public constructor(site: Site, user?: ExternalUser) {
    this.graphQL = new GraphQLTransport(user?.token || DEFAULT_AUTH_TOKEN, site._id, site.settings.graphqlPubApiKey);
  }

  /**
   * Fetch group Channels
   *
   * @param user current logged user
   */
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
                media {
                  type
                  url
                }
              }
            }
            lastReadTimestamp
            members {
              _id
              name
              image
              isBlocked
            }
            name
            unreadCount
            amIBlocked
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

  /**
   * Fetch the total of unread messages on a group channel
   *
   * @param user current logged user
   */
  public async fetchGroupChannelTotalUnreadCount(user?: ExternalUser): Promise<number> {
    if (typeof user?.token !== 'undefined') {
      this.graphQL.setToken(user.token);
    }

    const query = gql`
      {
        me {
          totalGroupChannelUnreadCount
        }
      }
    `;

    const data = await this.graphQL.client.request(query);

    const me = data.me as PublicUser;

    if (!me.totalGroupChannelUnreadCount) {
      return 0;
    }

    return me.totalGroupChannelUnreadCount;
  }

  /**
   * Create a new group channel or return a exist one
   *
   * @param input group channel config
   */
  public async createGroupChannel(input: {
    userIds: string[];
    siteId: string;
    firstMessage?: ChatMessageContent;
  }): Promise<GroupChannel> {
    const mutation = gql`
      mutation createGroupChannel($input: CreateGroupChannelInput!) {
        createGroupChannel(input: $input) {
          _id
          createdAt
          image
          lastClearedTimestamp
          lastMessage {
            createdAt
            message {
              text
              media {
                type
                url
              }
            }
          }
          lastReadTimestamp
          members {
            _id
            name
            image
            isBlocked
          }
          name
          amIBlocked
        }
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input });

    const groupChannel = data.createGroupChannel as GroupChannel;

    return groupChannel;
  }

  /**
   * Fetch all members of the chat
   *
   * @param chatId the current chat id
   */
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
              isBlocked
            }
          }
        }
      }
    `;

    const data = await this.graphQL.client.request(query, { id: chatId });

    const users = data.chatRoom.members.items as PublicUser[];

    return users;
  }

  /**
   * Fetch the group channel by id
   *
   * @param id group channel id
   */
  public async fetchGroupChannel(id: string): Promise<GroupChannel> {
    const query = gql`
      query groupChannel($id: ID!) {
        groupChannel(id: $id) {
          _id
          createdAt
          image
          lastClearedTimestamp
          lastMessage {
            createdAt
            message {
              text
              media {
                type
                url
              }
            }
          }
          lastReadTimestamp
          members {
            _id
            name
            image
            isBlocked
          }
          name
          unreadCount
          amIBlocked
        }
      }
    `;

    const data = await this.graphQL.client.request(query, { id });

    const groupChannel = data.groupChannel as GroupChannel;

    return groupChannel;
  }

  /**
   * Send a private message to a group channel
   *
   * @param privateMessageInput message config
   */
  public async sendPrivateMessage(privateMessageInput: PrivateMessageInput): Promise<string> {
    const mutation = gql`
      mutation sendMessage($input: SendMessageInput!) {
        sendMessage(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: privateMessageInput });

    const messageId = data.sendMessage as string;

    return messageId;
  }

  /**
   * Mark the group channel as read
   *
   * @param groupChannelId GroupChannel id
   */
  public async markGroupChannelRead(groupChannelId: string): Promise<boolean> {
    const mutation = gql`
      mutation markRead($input: MarkReadInput!) {
        markRead(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { groupChannelId } });

    const result = data.markRead as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  /**
   * Delete a private message on a group channel
   *
   * @param groupChannelId GroupChannel id
   * @param messageId ChatMessage id
   */
  public async deletePrivateMessage(groupChannelId: string, messageId: string): Promise<boolean> {
    const mutation = gql`
      mutation deleteMessage($input: DeleteMessageInput!) {
        deleteMessage(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { groupChannelId, messageId } });

    const result = data.deleteMessage as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  /**
   * Remove all messages of a group channel for a user
   *
   * @param groupChannelId GroupChannel id
   */
  public async removeGroupChannel(groupChannelId: string): Promise<boolean> {
    const mutation = gql`
      mutation removeGroupChannel($input: RemoveGroupChannelInput!) {
        removeGroupChannel(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { groupChannelId } });

    const result = data.removeGroupChannel as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  /**
   * Block a private user
   *
   * @param userId the id of a user that the current user wants to block
   */
  public async blockPrivateUser(userId: string): Promise<boolean> {
    const mutation = gql`
      mutation blockUser($input: BlockUserInput!) {
        blockUser(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { userId } });

    const result = data.blockUser as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  /**
   * Unblock a private user
   *
   * @param userId the id of a user that the current user wants to unblock
   */
  public async unblockPrivateUser(userId: string): Promise<boolean> {
    const mutation = gql`
      mutation unblockUser($input: BlockUserInput!) {
        unblockUser(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { userId } });

    const result = data.unblockUser as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }
}
