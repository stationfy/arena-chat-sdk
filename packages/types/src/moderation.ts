export interface Moderation {
  label: string;
  _id: string;
  siteId: string;
  chatRoomId: string;
  userId: string;
  status: ModeratorStatus;
}

export enum ModeratorStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
}
