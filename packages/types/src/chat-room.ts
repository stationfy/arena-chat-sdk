export interface ChatRoom extends LiveChatChannel {
  chatAutoOpen: boolean;
  chatClosedIsEnabled: boolean;
  chatPreviewEnabled: boolean;
  createdAt: number;
  lang: string;
  language: string;
  presenceId: string;
  profanityFilterType?: string;
  showOnlineUsersNumber: boolean;
  signUpRequired: boolean;
  signUpSettings: SignUpSettings;
  siteId: string;
  slug: string;
  standalone: boolean;
  numChannels: number;
  mainChannel: LiveChatChannel;
}

export interface LiveChatChannel {
  _id: string;
  allowSendGifs: boolean;
  allowShareUrls: boolean;
  chatColor: string;
  chatPreModerationIsEnabled: boolean;
  chatRequestModeratorIsEnabled: boolean;
  dataPath: string;
  hasPolls: boolean;
  name: string;
  qnaId?: string;
  qnaIsEnabled?: boolean;
  reactionsEnabled: boolean;
  showEmojiButton: boolean;
  unreadCount: number;
}

interface SignUpSettings {
  suggest: boolean;
  type: string;
}

export interface ChatModerationRequest {
  siteId: string;
  chatRoomId: string;
}
