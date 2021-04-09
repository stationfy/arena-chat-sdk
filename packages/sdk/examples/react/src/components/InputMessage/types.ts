export interface IInputMessage {
  value?: string;
  setValue: (value: string) => void;
  disabled?: boolean;
}
