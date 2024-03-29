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
  ChatMessageReportedBy,
  PublicUserInput,
  PrivateMessageInput,
  ChannelMessageReactions,
  PageRequest,
  CreatePollInput,
  Poll,
  ChatMessageToSend,
} from '@arena-im/chat-types';
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

  /**
   * Fetch group Channels
   *
   * @param user current logged user
   */
  public async fetchGroupChannels(user?: ExternalUser): Promise<GroupChannel[]> {
    if (typeof user?.token !== 'undefined') {
      this.transport.setToken(user.token);
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
              isModerator
              modLabel
            }
            name
            unreadCount
            amIBlocked
          }
        }
      }
    `;

    const data = await this.transport.client.request(query);

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
      this.transport.setToken(user.token);
    }

    const query = gql`
      {
        me {
          totalGroupChannelUnreadCount
        }
      }
    `;

    const data = await this.transport.client.request(query);

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
    firstMessage?: ChatMessageContent | undefined;
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
            isModerator
            modLabel
          }
          name
          amIBlocked
        }
      }
    `;

    const data = await this.transport.client.request(mutation, { input });

    const groupChannel = data.createGroupChannel as GroupChannel;

    return groupChannel;
  }

  /**
   * Fetch all members of the chat
   *
   * @param chatId the current chat id
   */
  public async fetchMembers(chatId: string, page: PageRequest, searchTerm: string): Promise<PublicUser[]> {
    const query = gql`
      query chatRoom($id: ID!, $page: PageRequest!, $searchTerm: String!) {
        chatRoom(id: $id) {
          members(page: $page, filter: { searchTerm: $searchTerm }) {
            items {
              _id
              name
              status
              modLabel
              isModerator
              modLabel
              image
              isBlocked
            }
          }
        }
      }
    `;

    const data = await this.transport.client.request(query, { id: chatId, page, searchTerm });

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
            isModerator
            modLabel
          }
          name
          unreadCount
          amIBlocked
        }
      }
    `;

    const data = await this.transport.client.request(query, { id });

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

    const data = await this.transport.client.request(mutation, { input: privateMessageInput });

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

    const data = await this.transport.client.request(mutation, { input: { groupChannelId } });

    const result = data.markRead as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  /**
   * Mark the group channel as read
   *
   * @param openChannelId GroupChannel id
   */
  public async markOpenChannelRead(openChannelId: string): Promise<boolean> {
    const mutation = gql`
      mutation markRead($input: MarkReadInput!) {
        markRead(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { openChannelId } });

    const result = data.markRead as boolean;

    if (!result) {
      throw new Error(Status.Failed);
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

    const data = await this.transport.client.request(mutation, { input: { groupChannelId, messageId } });

    const result = data.deleteMessage as boolean;

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

  /**
   * Fetch message reactions
   *
   * @param channelId Channel id
   * @param messageId Message id
   */
  public async fetchReactions(channelId: string, messageId: string): Promise<ChannelMessageReactions | null> {
    const query = gql`
      query openChannel($id: ID!, $_id: ID!) {
        openChannel(id: $id) {
          _id
          message(_id: $_id) {
            key
            reactions {
              anonymousCount
              total
              items {
                key
                user {
                  _id
                  name
                  bio
                  image
                }
                reaction
              }
            }
          }
        }
      }
    `;

    const data = await this.transport.client.request(query, { id: channelId, _id: messageId });

    const channel = data.openChannel as LiveChatChannel;

    if (!channel) {
      throw new Error(Status.Failed);
    }

    const reactions = channel.message?.reactions;

    return reactions || null;
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

    const data = await this.transport.client.request(mutation, { input: { groupChannelId } });

    const result = data.removeGroupChannel as boolean;

    if (!result) {
      throw new Error(Status.Failed);
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

    const data = await this.transport.client.request(mutation, { input: { userId } });

    const result = data.blockUser as boolean;

    if (!result) {
      throw new Error(Status.Failed);
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

    const data = await this.transport.client.request(mutation, { input: { userId } });

    const result = data.unblockUser as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async addQuestion(qnaId: string, text: string): Promise<string> {
    const mutation = gql`
      mutation addQuestion($input: AddQnAQuestionInput!) {
        addQuestion(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { qnaId, text } });

    const result = data.addQuestion as string;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async answerQuestion(qnaId: string, questionId: string, text: string): Promise<boolean> {
    const mutation = gql`
      mutation answerQuestion($input: AnswerQnAQuestionInput!) {
        answerQuestion(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { qnaId, questionId, text } });

    const result = data.answerQuestion as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async deleteQuestion(qnaId: string, questionId: string): Promise<boolean> {
    const mutation = gql`
      mutation deleteQuestion($input: QnAQuestionInput!) {
        deleteQuestion(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { qnaId, questionId } });

    const result = data.deleteQuestion as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async upvoteQuestion(qnaId: string, questionId: string, userId: string): Promise<boolean> {
    const mutation = gql`
      mutation upvoteQuestion($input: QnAQuestionUpvoteInput!) {
        upvoteQuestion(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { qnaId, questionId, userId } });

    const result = data.upvoteQuestion as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async banUser({ anonymousId, userId }: { anonymousId?: string; userId?: string }): Promise<boolean> {
    if (!anonymousId && !userId) {
      throw new Error(Status.Invalid);
    }

    const mutation = gql`
      mutation banUser($input: BanUserInput!) {
        banUser(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { anonymousId, userId } });

    const result = data.banUser as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async createPoll(input: CreatePollInput): Promise<Poll> {
    const mutation = gql`
      mutation createPoll($input: CreatePollInput!) {
        createPoll(input: $input) {
          _id
          chatRoomId
          createdAt
          createdBy
          draft
          duration
          expireAt
          options {
            name
            total
          }
          publishedAt
          question
          showVotes
          siteId
          total
          updatedAt
        }
      }
    `;

    const data = await this.transport.client.request(mutation, { input });

    const result = data.createPoll as Poll;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async deletePoll(pollId: string): Promise<Poll> {
    const mutation = gql`
      mutation deletePoll($id: ID!) {
        deletePoll(id: $id) {
          _id
          chatRoomId
          createdAt
          createdBy
          draft
          duration
          expireAt
          options {
            name
            total
          }
          publishedAt
          question
          showVotes
          siteId
          total
          updatedAt
        }
      }
    `;

    const data = await this.transport.client.request(mutation, { id: pollId });

    const result = data.deletePoll as Poll;

    if (!result) {
      throw new Error(Status.Failed);
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
    const data = await this.transport.client.request(mutation, { input: { pollId, userId, optionId } });

    const result = data.pollVote as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async sendMessaToChannel(input: ChatMessageToSend): Promise<string> {
    const mutation = gql`
      mutation sendMessage($input: SendMessageInput!) {
        sendMessage(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input });

    const result = data.sendMessage as string;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async sendMonetizationMessageToChannel(input: ChatMessage): Promise<string> {
    const mutation = gql`
      mutation sendMessage($input: MonetizationMessageInput!) {
        sendMonetizationMessage(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input });

    const result = data.sendMonetizationMessage as string;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async deleteOpenChannelMessage(openChannelId: string, messageId: string): Promise<boolean> {
    const mutation = gql`
      mutation deleteMessage($input: DeleteMessageInput!) {
        deleteMessage(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { openChannelId, messageId } });

    const result = data.deleteMessage as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async reportOpenChannelMessage(
    channelId: string,
    messageId: string,
    reportedBy: ChatMessageReportedBy,
  ): Promise<boolean> {
    const mutation = gql`
      mutation reportChannelMessage($input: ReportMessageInput!) {
        reportChannelMessage(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, {
      input: { channelId, messageId, reportDoc: { reportedBy } },
    });

    const result = data.reportChannelMessage as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  /**
   * Fetch a pinned message for a channel
   *
   * @param channelId the id of a chahnnel that the current user wants to fetch the pin message
   */
  public async fetchPinMessage({ channelId }: { channelId: string }): Promise<ChatMessage> {
    if (!channelId) {
      throw new Error("Can't fetch pin message without a channel id");
    }
    const query = gql`
      query listPinnedMessage($id: ID!) {
        openChannel(id: $id) {
          pinnedMessage {
            key
            message {
              media {
                authorImage
                authorName
                authorUrl
                description
                html
                providerName
                providerUrl
                thumbnailUrl
                title
                type
                url
                videoUrl
              }
              text
            }
            card
            sender {
              anonymousId
              displayName
              label
              moderator
              name
              photoURL
              uid
            }
          }
        }
      }
    `;
    const data = await this.transport.client.request(query, { id: channelId });

    const result = data.openChannel as ChatMessage;

    if (!result) {
      throw new Error(Status.Failed);
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
            unreadCount
            externalId
          }
        }
      }
    `;

    const data = await this.transport.client.request(query, { id: chatId });

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
          chatPreModerationIsEnabled
          chatRequestModeratorIsEnabled
          dataPath
          externalId
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

    const data = await this.transport.client.request(query, { id: channelId });

    const channel = data.openChannel as LiveChatChannel;

    if (!channel) {
      throw new Error(Status.Invalid);
    }

    return channel;
  }

  public async fetchUserProfile(userId: string): Promise<PublicUser> {
    const query = gql`
      query user($id: ID!) {
        user(id: $id) {
          _id
          name
          image
          defaultImage
          isModerator
          bio
          socialLinks {
            url
            provider
          }
          isBlocked
          userName
          location
          slug
          customProps {
            label
            value
          }
        }
      }
    `;

    const data = await this.transport.client.request(query, { id: userId });

    const user = data.user as PublicUser;

    if (!user) {
      throw new Error(Status.Invalid);
    }

    return user;
  }

  public async updateUser(user: PublicUserInput): Promise<PublicUser> {
    const mutation = gql`
      mutation updateUser($input: PublicUserInput!) {
        updateUser(input: $input) {
          _id
          name
          image
          defaultImage
          isModerator
          bio
          socialLinks {
            url
            provider
          }
          isBlocked
          userName
          location
          slug
        }
      }
    `;

    const input: PublicUserInput = {};

    if (typeof user.bio !== 'undefined') {
      input.bio = user.bio;
    }

    if (user.socialLinks) {
      input.socialLinks = user.socialLinks;
    }

    if (typeof user.location !== 'undefined') {
      input.location = user.location;
    }

    if (typeof user.name !== 'undefined') {
      input.name = user.name;
    }

    if (typeof user.socialLinks !== 'undefined') {
      input.socialLinks = user.socialLinks;
    }

    if (typeof user.image !== 'undefined') {
      input.image = user.image;
    }

    if (typeof user.useDefaultImage !== 'undefined') {
      input.useDefaultImage = user.useDefaultImage;
    }

    if (typeof user.password !== 'undefined') {
      input.password = user.password;
    }

    const data = await this.transport.client.request(mutation, { input });

    const result = data.updateUser as PublicUser;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async fetchUserReminderSubscription(reminderId: string): Promise<boolean> {
    const query = gql`
      query reminderSubscription($id: ID!) {
        me {
          _id
          name
          isSubscribedToReminder(id: $id)
        }
      }
    `;
    const data = await this.transport.client.request(query, { id: reminderId });

    const result = data?.me?.isSubscribedToReminder as boolean;

    if (!data) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async subscribeUserToReminder(reminderId: string, url: string): Promise<boolean> {
    const mutation = gql`
      mutation subscribe($input: SubscribeReminderInput!) {
        subscribeReminder(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { reminderId, url } });

    const result = data.subscribeReminder as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async unsubscribeUserToReminder(reminderId: string): Promise<boolean> {
    const mutation = gql`
      mutation unsubscribe($input: UnsubscribeReminderInput!) {
        unsubscribeReminder(input: $input)
      }
    `;

    const data = await this.transport.client.request(mutation, { input: { reminderId } });

    const result = data.unsubscribeReminder as boolean;

    if (!result) {
      throw new Error(Status.Failed);
    }

    return result;
  }

  public async fetchTotalAnonymousUsers(chatId: string, isOnline?: boolean): Promise<number> {
    const query = gql`
      query chatRoom($id: ID!${typeof isOnline === 'boolean' ? ', $isOnline: Boolean' : ''}) {
        chatRoom(id: $id) {
          memberCount(userType: "anonymous"${typeof isOnline === 'boolean' ? ', isOnline: $isOnline' : ''}) {
            total
          }
        }
      }
    `;

    const variables: { id: string; isOnline?: boolean } = { id: chatId };

    if (typeof isOnline === 'boolean') {
      variables.isOnline = isOnline;
    }

    const data = await this.transport.client.request(query, variables);

    const total = data.chatRoom.memberCount.total as number;

    return total;
  }
}
