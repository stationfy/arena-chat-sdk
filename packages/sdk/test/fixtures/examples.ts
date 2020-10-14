import {
  Site,
  GroupChannel,
  PublicUserStatus,
  ChatMessage,
  PublicUser,
  ExternalUser,
  QnaQuestion,
  ChatRoom,
  QnaProps,
} from '@arena-im/chat-types';
import { ArenaChat } from '../../src/sdk';

export const exampleChatRoom: ChatRoom = {
  allowSendGifs: true,
  allowShareUrls: true,
  chatAutoOpen: false,
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
};

export const exampleSite: Site = {
  _id: 'site-id',
  displayName: 'First Site',
  settings: {
    graphqlPubApiKey: '1234',
  },
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

export const exampleSDK = new ArenaChat('my-api-key');
exampleSDK.site = exampleSite;
exampleSDK.user = exampleUser;

export const exampleQnaQuestion: QnaQuestion = {
  createdAt: 1111111111,
  isAnswered: false,
  key: 'fake-qna-question',
  sender: examplePublicUser,
  text: 'what are you doing?',
  upvotes: 5,
  answer: {
    text: 'fake answer',
    sender: examplePublicUser,
  },
  userVoted: false,
};

export const exampleQnaProps: QnaProps = {
  preModeration: true,
  language: 'en-us',
  status: 'OK',
  updatedAt: 11111,
  createdAt: 11111,
  createdBy: 'fake-user',
  name: 'Fake Q&A',
};
