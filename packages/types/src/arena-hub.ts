export interface TrackPayload {
  userId?: string | null;
  anonymousId?: string;
  type: string;
  context: TrackContext;
  messageId: string;
  timestamp: string;
  writeKey: string;
  sentAt: string;
  properties: TrackPageInfo;
  arenaUserId?: string | null;
}

export interface TrackContext {
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

export interface TrackPageInfo {
  path: string;
  referrer: string;
  search: string;
  title: string;
  url: string;
}
