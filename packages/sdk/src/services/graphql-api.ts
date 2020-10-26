import { gql } from 'graphql-request';
import {
  ExternalUser,
  PublicUser,
  GroupChannel,
  Site,
  ChatMessageContent,
  LiveChatChannel,
  ChatMessage,
  Status,
} from '@arena-im/chat-types';
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
              status
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
            status
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
            status
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

  public async addQuestion(qnaId: string, text: string): Promise<string> {
    const mutation = gql`
      mutation addQuestion($input: AddQnAQuestionInput!) {
        addQuestion(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { qnaId, text } });

    const result = data.addQuestion as string;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async answerQuestion(qnaId: string, questionId: string, text: string): Promise<boolean> {
    const mutation = gql`
      mutation answerQuestion($input: AnswerQnAQuestionInput!) {
        answerQuestion(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { qnaId, questionId, text } });

    const result = data.answerQuestion as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async deleteQuestion(qnaId: string, questionId: string): Promise<boolean> {
    const mutation = gql`
      mutation deleteQuestion($input: QnAQuestionInput!) {
        deleteQuestion(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { qnaId, questionId } });

    const result = data.deleteQuestion as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async upvoteQuestion(qnaId: string, questionId: string, userId: string): Promise<boolean> {
    const mutation = gql`
      mutation upvoteQuestion($input: QnAQuestionUpvoteInput!) {
        upvoteQuestion(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { qnaId, questionId, userId } });

    const result = data.upvoteQuestion as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async banUser({ anonymousId, userId }: { anonymousId?: string; userId?: string }): Promise<boolean> {
    if (!anonymousId && !userId) {
      throw new Error('failed');
    }

    const mutation = gql`
      mutation banUser($input: BanUserInput!) {
        banUser(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { anonymousId, userId } });

    const result = data.banUser as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
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
    const data = await this.graphQL.client.request(mutation, { input: { pollId, userId, optionId } });

    const result = data.pollVote as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async sendMessaToChannel(input: ChatMessage): Promise<string> {
    const mutation = gql`
      mutation sendMessage($input: PollVoteInput!) {
        sendMessage(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input });

    const result = data.sendMessage as string;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async deleteOpenChannelMessage(openChannelId: string, messageId: string): Promise<boolean> {
    const mutation = gql`
      mutation deleteMessage($input: DeleteMessageInput!) {
        deleteMessage(input: $input)
      }
    `;

    const data = await this.graphQL.client.request(mutation, { input: { openChannelId, messageId } });

    const result = data.deleteMessage as boolean;

    if (!result) {
      throw new Error('failed');
    }

    return result;
  }

  public async listChannels(chatId: string): Promise<LiveChatChannel[]> {
    const query = gql`
      query chatRoom($id: ID!) {
        chatRoom(id: $id) {
          channels {
            _id
            name
            dataPath
            unreadCount
            qnaId
            qnaIsEnabled
            reactionsEnabled
            showEmojiButton
            unreadCount
          }
        }
      }
    `;

    const data = await this.graphQL.client.request(query, { id: chatId });

    const channels = data.chatRoom.channels as LiveChatChannel[];

    return channels;
  }

  public async fetchChannel(channelId: string): Promise<LiveChatChannel> {
    const query = gql`
      query openChannel($id: ID!) {
        openChannel(id: $id) {
          _id
          allowSendGifs
          allowShareUrls
          chatColor
          chatPreModerationsIsEnabled
          chatRequestModeratorIsEnabled
          dataPath
          hasPolls
          name
          qnaIsEnabled
          qnaId
          reactionsEnabled
          showEmojiButton
          unreadCount
        }
      }
    `;

    const data = await this.graphQL.client.request(query, { id: channelId });

    const channel = data.openChannel as LiveChatChannel;

    if (!channel) {
      throw new Error(Status.Invalid);
    }

    return channel;
  }
}
