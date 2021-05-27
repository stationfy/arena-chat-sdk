export interface TrackPayload {
  userId?: string | null;
  anonymousId: string;
  type: 'page' | 'track' | 'identify';
  context: TrackContext;
  messageId: string;
  timestamp: string;
  writeKey: string;
  sentAt: string;
  properties: TrackPageInfo | (TrackPageInfo & EventMap[keyof EventMap]);
  arenaUserId?: string | null;
  event?: keyof EventMap;
}

export interface EventMap {
  'Chat Message Published': undefined;
  USER_LOGGED_IN: undefined;
  'User Logged Out': undefined;
  'Private List Viewed': undefined;
  'Live Chat Viewed': undefined;
  'QnA List Viewed': undefined;
  'Polls List Viewed': undefined;
  'Chat Conversation Deleted': undefined;
  'User Blocked': undefined;
  'Chat QnA Question Submitted': undefined;
  'Chat QnA Question Voted': undefined;
  'Channels List Viewed': undefined;
  'Poll Voted': { pollId: string; option: number };
  'Chat Message Reacted': {
    chatRoomId: string;
    isReply: boolean;
    reaction: string;
    isPrivate: boolean;
    isChannel: boolean;
  };
}

interface TrackContext {
  library: {
    name: string;
    version: string;
  };
  page: TrackPageInfo;
  userAgent: string;
  widgetId: string;
  widgetType: string;
  browserLanguage: string;
}

interface TrackPageInfo {
  path: string;
  referrer: string;
  search: string;
  title: string;
  url: string;
}
