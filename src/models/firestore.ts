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
  limit?: number;
  orderBy?: OrderBy[];
  startAt?: any[];
  where?: Where[];
  endAt?: any[];
}
