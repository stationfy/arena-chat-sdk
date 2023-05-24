export interface ArenaSocketMessage {
  isTail: boolean;
  content: {
    createdAt: number;
    key: string;
    message: {
      text: string;
    };
    sender: {
      displayName: string;
      image: string;
      label: string;
      moderator: boolean;
      name: string;
      photoURL: string;
      providerId: string;
      uid: string;
      userName: string;
    };
  };
  time: number;
  kind: number;
  id: string;
  reachedStart: boolean;
}
