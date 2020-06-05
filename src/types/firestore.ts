export interface OrderBy {
  field: string;
  desc?: boolean;
}

export interface Where {
  fieldPath: string;
  opStr: firebase.firestore.WhereFilterOp;
  value: any;
}

export interface ListenChangeConfig {
  path: string;
  callback: (messages: firebase.firestore.DocumentData[]) => void;
  limit?: number;
  orderBy?: OrderBy[];
  startAt?: any[];
  where?: Where[];
}
