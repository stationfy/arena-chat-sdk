import { GraphQLAPI } from '@services/graphql-api';
import { GraphQLTransport, OrganizationSite, UserObservable } from '@arena-im/core';
import {
  exampleSite,
  exampleGroupChannel,
  exampleChatMessage,
  examplePublicUser,
  exampleLiveChatChannel,
} from '../../fixtures/examples';
import { RequestDocument } from 'graphql-request/dist/types';
import { ChatMessageContent, Status } from '@arena-im/chat-types';

jest.mock('@arena-im/core', () => ({
  GraphQLTransport: jest.fn(),
  OrganizationSite: {
    instance: jest.fn(),
  },
  UserObservable: {
    instance: {
      onUserChanged: jest.fn(),
    },
  },
  User: {
    instance: {},
  },
}));

describe('GraphQLAPI', () => {
  beforeAll(() => {
    // @ts-ignore
    OrganizationSite.instance = {
      getSite: jest.fn(async () => exampleSite),
    };

    UserObservable.instance.onUserChanged = jest.fn();
  });

  beforeEach(() => {
    GraphQLAPI.cleanInstance();
  });

  describe('fetchGroupChannels()', () => {
    it('should fetch the user group channels', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                groupChannels: [exampleGroupChannel],
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const groupChannels = await graphqlAPI.fetchGroupChannels();

      expect(groupChannels).toEqual([exampleGroupChannel]);
    });

    it('should return an empty array when group channels are invalid', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                groupChannels: null,
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const groupChannels = await graphqlAPI.fetchGroupChannels();

      expect(groupChannels).toEqual([]);
    });
  });

  describe('fetchGroupChannelTotalUnreadCount()', () => {
    it('should fetch the group channel total unread messages count', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                totalGroupChannelUnreadCount: 10,
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const total = await graphqlAPI.fetchGroupChannelTotalUnreadCount();

      expect(total).toEqual(10);
    });

    it('should return 0 as total of unread message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              me: {
                totalGroupChannelUnreadCount: 0,
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const total = await graphqlAPI.fetchGroupChannelTotalUnreadCount();

      expect(total).toEqual(0);
    });
  });

  describe('createGroupChannel()', () => {
    it('should create a group channel', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (
            _: RequestDocument,
            variables: {
              input: {
                userIds: string[];
                siteId: string;
                firstMessage?: ChatMessageContent;
              };
            },
          ) => {
            const groupChannel = { ...exampleGroupChannel };

            if (groupChannel.members) {
              groupChannel.members[0]._id = variables.input.userIds[0];
              groupChannel.members[1]._id = variables.input.userIds[1];
            }

            return {
              createGroupChannel: groupChannel,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const groupChannel = await graphqlAPI.createGroupChannel({
        userIds: ['u1234', 'u5678'],
        siteId: 'fake-site',
      });

      const newGroupChannel = { ...exampleGroupChannel };
      if (newGroupChannel.members) {
        newGroupChannel.members[0]._id = 'u1234';
        newGroupChannel.members[1]._id = 'u5678';
      }

      expect(groupChannel).toEqual(newGroupChannel);
    });

    it('should create a group channel with a first message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (
            _: RequestDocument,
            variables: {
              input: {
                userIds: string[];
                siteId: string;
                firstMessage?: ChatMessageContent;
              };
            },
          ) => {
            const groupChannel = { ...exampleGroupChannel };

            if (groupChannel.members) {
              groupChannel.members[0]._id = variables.input.userIds[0];
              groupChannel.members[1]._id = variables.input.userIds[1];
            }

            const message = { ...exampleChatMessage };

            if (variables.input.firstMessage) {
              message.message = variables.input.firstMessage;
            }

            groupChannel.lastMessage = message;

            return {
              createGroupChannel: groupChannel,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const groupChannel = await graphqlAPI.createGroupChannel({
        userIds: ['u1234', 'u5678'],
        siteId: 'fake-site',
        firstMessage: exampleChatMessage.message,
      });

      const newGroupChannel = { ...exampleGroupChannel };
      if (newGroupChannel.members) {
        newGroupChannel.members[0]._id = 'u1234';
        newGroupChannel.members[1]._id = 'u5678';
      }

      newGroupChannel.lastMessage = exampleChatMessage;

      expect(groupChannel).toEqual(newGroupChannel);
    });
  });

  describe('fetchMembers()', () => {
    it('should fetch the chat members', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              chatRoom: {
                members: {
                  items: [examplePublicUser],
                },
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const page = {
        first: 25,
      };

      const searchTerm = '';

      const members = await graphqlAPI.fetchMembers('chat-id-fake', page, searchTerm);

      expect(members).toEqual([examplePublicUser]);
    });
  });

  describe('fetchGroupChannel()', () => {
    it('should fetch a group channel', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (_: RequestDocument, variables: { id: string }) => {
            return {
              groupChannel: { ...exampleGroupChannel, _id: variables.id },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const groupChannel = await graphqlAPI.fetchGroupChannel('fake-channel');

      expect(groupChannel._id).toEqual('fake-channel');
    });
  });

  describe('fetchChannel()', () => {
    it('should fetch a channel by id', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async (_: RequestDocument, variables: { id: string }) => {
            return {
              openChannel: { ...exampleLiveChatChannel, _id: variables.id },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const channel = await graphqlAPI.fetchChannel('fake-channel');

      expect(channel._id).toEqual('fake-channel');
    });

    it('should throw an exception when return an invalid channel', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              openChannel: null,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.fetchChannel('fake-channel');
        })
        .catch((error) => {
          expect(error.message).toEqual(Status.Invalid);
          done();
        });
    });
  });

  describe('listChannels()', () => {
    it('should fetch the list of channels by chat id', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              chatRoom: { channels: [exampleLiveChatChannel] },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const channels = await graphqlAPI.listChannels('fake-chat');

      expect(channels.length).toEqual(1);
    });
  });

  describe('deleteReaction()', () => {
    it('should delete a message reaction', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteReaction: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.deleteReaction('fake-user', 'fake-message', 'like');

      expect(result).toBe(true);
    });

    it('should throw an exception when return false from server', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteReaction: null,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.deleteReaction('fake-user', 'fake-message', 'like');
        })
        .catch((error) => {
          expect(error.message).toEqual(Status.Failed);
          done();
        });
    });
  });

  describe('deleteOpenChannelMessage()', () => {
    it('should delete an open channel message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteMessage: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.deleteOpenChannelMessage('fake-channel', 'fake-message');

      expect(result).toBe(true);
    });

    it('should throw an exception when return false from server', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              openChannel: null,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.deleteOpenChannelMessage('fake-channel', 'fake-message');
        })
        .catch((error) => {
          expect(error.message).toEqual(Status.Failed);
          done();
        });
    });
  });

  describe('sendMessaToChannel()', () => {
    it('should send a channel message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              sendMessage: 'fake-message',
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.sendMessaToChannel(exampleChatMessage);

      expect(result).toBe('fake-message');
    });

    it('should throw an exception when get an invalid message from server', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              sendMessage: null,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.sendMessaToChannel(exampleChatMessage);
        })
        .catch((error) => {
          expect(error.message).toEqual(Status.Failed);
          done();
        });
    });
  });

  describe('markOpenChannelRead()', () => {
    it('should mark all channel as read', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              markRead: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.markOpenChannelRead('fake-channel-id');

      expect(result).toBe(true);
    });

    it('should throw an exception when get false from server', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              markRead: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.markOpenChannelRead('fake-channel-id');
        })
        .catch((error) => {
          expect(error.message).toEqual(Status.Failed);
          done();
        });
    });
  });

  describe('pollVote()', () => {
    it('should send a poll vote', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              pollVote: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.pollVote({ pollId: 'fake-poll', userId: 'fake-user-id', optionId: 0 });

      expect(result).toBe(true);
    });

    it('should throw an exception when get false from server', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              pollVote: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.pollVote({ pollId: 'fake-poll', userId: 'fake-user-id', optionId: 0 });
        })
        .catch((error) => {
          expect(error.message).toEqual(Status.Failed);
          done();
        });
    });
  });

  describe('sendPrivateMessage()', () => {
    it('should send a privagte message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              sendMessage: 'fake-message',
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const messageId = await graphqlAPI.sendPrivateMessage({
        groupChannelId: 'group-channel-fake',
        message: exampleChatMessage.message,
      });

      expect(messageId).toEqual('fake-message');
    });
  });

  describe('markGroupChannelRead()', () => {
    it('should mark a group channel as read', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              markRead: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.markGroupChannelRead('fake-group-channel');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              markRead: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.markGroupChannelRead('fake-group-channel');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('deletePrivateMessage()', () => {
    it('should delete a message on a group channel', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteMessage: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.deletePrivateMessage('fake-group-channel', 'fake-massage');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteMessage: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.deletePrivateMessage('fake-group-channel', 'fake-massage');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('removeGroupChannel()', () => {
    it('should delete a group channel for a user', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              removeGroupChannel: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.removeGroupChannel('fake-group-channel');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              removeGroupChannel: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.removeGroupChannel('fake-group-channel');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('blockPrivateUser()', () => {
    it('should block a user on private group', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              blockUser: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.blockPrivateUser('fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              blockUser: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.blockPrivateUser('fake-user');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('unblockPrivateUser()', () => {
    it('should unblock a user on private group', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              unblockUser: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.unblockPrivateUser('fake-user');

      expect(result).toBeTruthy();
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              unblockUser: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.unblockPrivateUser('fake-user');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('addQuestion()', () => {
    it('should add a question on Q&A', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              addQuestion: 'fake-qna-id',
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.addQuestion('fake-qna-id', 'hey?');

      expect(result).toEqual('fake-qna-id');
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              addQuestion: null,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.addQuestion('fake-qna-id', 'hey?');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('answerQuestion()', () => {
    it('should answer a question on Q&A', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              answerQuestion: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.answerQuestion('fake-qna-id', 'fake-question-id', 'hey?');

      expect(result).toEqual(true);
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              answerQuestion: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.answerQuestion('fake-qna-id', 'fake-question-id', 'hey?');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('deleteQuestion()', () => {
    it('should delete a question on Q&A', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteQuestion: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.deleteQuestion('fake-qna-id', 'fake-question-id');

      expect(result).toEqual(true);
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              deleteQuestion: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.deleteQuestion('fake-qna-id', 'fake-question-id');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('upvoteQuestion()', () => {
    it('should upvote a question on Q&A', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              upvoteQuestion: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.upvoteQuestion('fake-qna-id', 'fake-question-id', 'fake-user-id');

      expect(result).toEqual(true);
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              upvoteQuestion: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.upvoteQuestion('fake-qna-id', 'fake-question-id', 'fake-user-id');
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });
  });

  describe('banUser()', () => {
    it('should ban a user on Q&A', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              banUser: true,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.banUser({ anonymousId: 'anonymous-user-id' });

      expect(result).toEqual(true);
    });

    it('should return an exception', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              banUser: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.banUser({ anonymousId: 'anonymous-user-id' });
        })
        .catch((e) => {
          expect(e.message).toEqual('failed');
          done();
        });
    });

    it('should return an exception when there is no anonymousId or userId', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              banUser: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.banUser({});
        })
        .catch((e) => {
          expect(e.message).toEqual(Status.Invalid);
          done();
        });
    });
  });

  describe('fetchPinMessage()', () => {
    it('should fetch pinned message for a site', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              openChannel: {
                fetchPinMessage: {
                  exampleChatMessage,
                },
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.fetchPinMessage({ channelId: 'fake-channel-id' });

      expect(result).toEqual({ fetchPinMessage: { exampleChatMessage } });
    });

    it('should return an error when channelId is not present', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              openChannel: {
                fetchPinMessage: {
                  exampleChatMessage,
                },
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          // @ts-ignore
          return graphqlAPI.fetchPinMessage({});
        })
        .catch((e) => {
          expect(e.message).toEqual("Can't fetch pin message without a channel id");
          done();
        });
    });

    it('should return invalid error when there is no response', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              fetchPinMessage: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.fetchPinMessage({ channelId: 'fake-channel-id' });
        })
        .catch((e) => {
          expect(e.message).toEqual(Status.Failed);
          done();
        });
    });
  });

  describe('fetchReactions()', () => {
    it('should fetch reactions from message', async () => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              openChannel: {
                message: {
                  reactions: {
                    anonymousCount: 41,
                    total: 42,
                    user: {
                      _id: 42,
                      name: 'Tralala',
                      bio: 'Bio test',
                    },
                  },
                },
              },
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      const graphqlAPI = await GraphQLAPI.instance;

      const result = await graphqlAPI.fetchReactions('fake-channel-id', 'fake-message-id');

      expect(result).toEqual({
        anonymousCount: 41,
        total: 42,
        user: {
          _id: 42,
          name: 'Tralala',
          bio: 'Bio test',
        },
      });
    });

    it('should return invalid error when there is no response', (done) => {
      const graphQLTransportInstanceMock = {
        client: {
          request: async () => {
            return {
              openChannel: false,
            };
          },
        },
      };

      // @ts-ignore
      GraphQLTransport.mockImplementation(() => {
        return graphQLTransportInstanceMock;
      });

      GraphQLAPI.instance
        .then((graphqlAPI) => {
          return graphqlAPI.fetchReactions('fake-channel-id', 'fake-message-id');
        })
        .catch((e) => {
          expect(e.message).toEqual(Status.Failed);
          done();
        });
    });
  });
});
