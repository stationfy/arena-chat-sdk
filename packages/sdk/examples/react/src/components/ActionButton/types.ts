export interface IActionButton {
  iconUrl: string;
  size?: number;
  action: () => void;
  hideOnMobile?: boolean;
}
