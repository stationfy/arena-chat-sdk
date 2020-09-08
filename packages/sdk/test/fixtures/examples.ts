import { Site, GroupChannel, PublicUserStatus, ChatMessage, PublicUser, ExternalUser } from '@arena-im/chat-types';

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
