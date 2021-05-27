import {
  Site,
  GroupChannel,
  PublicUserStatus,
  ChatMessage,
  PublicUser,
  ExternalUser,
  QnaQuestion,
  ChatRoom,
  Poll,
  QnaProps,
  LiveChatChannel,
  ServerReaction,
} from '@arena-im/chat-types';

export const exampleLiveChatChannel: LiveChatChannel = {
  _id: 'fake-main-channel',
  allowSendGifs: true,
  allowShareUrls: true,
  chatColor: '#FFFFFF',
  chatPreModerationIsEnabled: true,
  chatRequestModeratorIsEnabled: true,
  dataPath: '/chat-room/fake-main-channel',
  hasPolls: true,
  name: 'Fake Main Channel',
  qnaId: 'fake-qna',
  qnaIsEnabled: true,
  reactionsEnabled: true,
  showEmojiButton: true,
  unreadCount: 0,
};

export const exampleChatRoom: ChatRoom = {
  allowSendGifs: true,
  allowShareUrls: true,
  chatAutoOpen: false,
  chatColor: '#FFFFFF',
  chatClosedIsEnabled: false,
  chatPreModerationIsEnabled: false,
  chatPreviewEnabled: true,
  chatRequestModeratorIsEnabled: false,
  createdAt: 1592335254033,
  _id: 'new-chatroom',
  lang: 'en-us',
  language: 'en-us',
  name: 'My First ChatRoom',
  presenceId: 'pesence-id',
  reactionsEnabled: true,
  showOnlineUsersNumber: true,
  signUpRequired: false,
  signUpSettings: {
    suggest: true,
    type: 'REQUIRED',
  },
  siteId: 'site-id',
  slug: 'crsl',
  standalone: false,
  dataPath: '/chat-room/fake-main-channel',
  hasPolls: true,
  numChannels: 1,
  mainChannel: exampleLiveChatChannel,
  showEmojiButton: true,
  unreadCount: 0,
  version: '2',
};

export const exampleSite: Site = {
  _id: 'site-id',
  displayName: 'First Site',
  settings: {
    graphqlPubApiKey: '1234',
  },
  slug: 'site-slug',
};

export const exampleGroupChannel: GroupChannel = {
  _id: 'fake-channel',
  createdAt: 12342134323,
  lastMessage: {
    createdAt: 123412341234,
    message: {
      text: 'hey!',
    },
    publisherId: '1234',
    sender: {
      uid: 'fake-user',
      displayName: 'Fake User',
      photoURL: 'https://www.test.com/image-user.png',
    },
  },
  members: [
    {
      _id: 'fake-user-1',
      name: 'Fake user 1',
      image: 'https://www.test.com/image1.png',
      isBlocked: false,
      status: PublicUserStatus.OFFLINE,
    },
    {
      _id: 'fake-user-2',
      name: 'Fake user 2',
      image: 'https://www.test.com/image2.png',
      isBlocked: false,
      status: PublicUserStatus.ONLINE,
    },
  ],
  unreadCount: 0,
  amIBlocked: false,
};

export const exampleChatMessage: ChatMessage = {
  key: 'fake-message',
  createdAt: 1111111111,
  message: {
    text: 'hey you!',
  },
  publisherId: '1234',
  sender: {
    uid: 'fake-user',
    displayName: 'Fake User',
    photoURL: 'https://www.test.com/image-user.png',
  },
};

export const examplePublicUser: PublicUser = {
  _id: 'fake-user-uid',
  name: 'Kristin Mckinney',
  status: PublicUserStatus.OFFLINE,
  isModerator: false,
  image: 'https://randomuser.me/api/portraits/women/12.jpg',
  isBlocked: false,
};

export const exampleUser: ExternalUser = {
  image: 'https://randomuser.me/api/portraits/women/12.jpg',
  name: 'Kristin Mckinney',
  id: 'fake-user-uid',
  email: 'test@test.com',
  token: 'user-token',
};

export const apiKey = 'my-api-key';

export const exampleQnaQuestion: QnaQuestion = {
  createdAt: 1111111111,
  isAnswered: false,
  key: 'fake-qna-question',
  sender: examplePublicUser,
  text: 'what are you doing?',
  upvotes: 5,
  answer: {
    text: 'hey!',
    sender: examplePublicUser,
  },
  userVoted: true,
};

export const examplePoll: Poll = {
  _id: 'fake-poll',
  chatRoomId: 'new-chatroom',
  createdAt: 111111,
  createBy: 'fake-user',
  draft: false,
  duration: 900000,
  options: [
    {
      name: 'op 1',
      total: 10,
    },
    {
      name: 'op 2',
      total: 25,
    },
  ],
  publishedAt: 111111,
  question: 'what are you doing?',
  showVotes: true,
  siteId: 'site-id',
  total: 35,
  updatedAt: 1111111,
  expireAt: 2222222,
};

export const exampleQnaProps: QnaProps = {
  preModeration: false,
  language: 'en-us',
  status: 'ENABLED',
  updatedAt: 1111,
  createdAt: 1111,
  createdBy: 'fake-user',
  name: 'fake qna',
};

export const exampleServerReaction: ServerReaction = {
  itemType: 'chatMessage',
  reaction: 'love',
  publisherId: 'fake-publisher-id',
  itemId: 'fake-message-id',
  userId: 'fake-uid',
  openChannelId: 'fake-channel-id',
  chatRoomId: 'fake-chat-room-id',
  chatRoomVersion: 'V2',
  isDashboardUser: false,
};
