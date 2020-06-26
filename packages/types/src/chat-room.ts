export interface ChatRoom {
  allowSendGifs: boolean;
  allowShareUrls: boolean;
  chatAutoOpen: boolean;
  chatClosedIsEnabled: boolean;
  chatPreModerationIsEnabled: boolean;
  chatPreviewEnabled: boolean;
  chatRequestModeratorIsEnabled: boolean;
  createdAt: number;
  id: string;
  lang: string;
  language: string;
  name: string;
  presenceId: string;
  profanityFilterType?: string;
  reactionsEnabled: boolean;
  showOnlineUsersNumber: boolean;
  signUpRequired: boolean;
  signUpSettings: SignUpSettings;
  siteId: string;
  slug: string;
  standalone: boolean;
}

interface SignUpSettings {
  suggest: boolean;
  type: string;
}

export interface ChatModerationRequest {
  siteId: string;
  chatRoomId: string;
}
