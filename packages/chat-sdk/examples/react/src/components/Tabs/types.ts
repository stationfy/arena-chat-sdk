export enum CurrentTabIndex {
  CHAT,
  CHANNELS,
  QNA,
  POLLS,
}

export interface ITabs {
  currentTabIndex: CurrentTabIndex;
  toggleTab: (tabIndex: number) => void;
}
