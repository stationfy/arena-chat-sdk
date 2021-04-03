export interface IActionButton extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  iconUrl: string;
  size?: number;
  hideOnMobile?: boolean;
}
