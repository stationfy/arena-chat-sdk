import * as firebase from 'firebase/app';
import 'firebase/firestore';

const config = {
  apiKey: 'AIzaSyB403ShuFdFs733kTm7HJyVTkswCQlUmTA',
  authDomain: 'arena-im-dev.firebaseapp.com',
  projectId: 'arena-im-dev',
};

// @ts-ignore
const app = firebase.initializeApp(config);

const firestore = app.firestore();

interface OrderBy {
  field: string;
  desc?: boolean;
}

interface Where {
  fieldPath: string;
  opStr: firebase.firestore.WhereFilterOp;
  value: any;
}

interface ListenChangeConfig {
  path: string;
  callback: (messages: firebase.firestore.DocumentData[]) => void;
  limit?: number;
  orderBy?: OrderBy[];
  startAt?: any[];
  where?: Where[];
}

/**
 *
 * @param listnConfig
 */
export function listenToChange({ path, callback, limit, orderBy, where }: ListenChangeConfig): Function {
  let queryRef = getQueryRefByPath(path);

  if (queryRef === null) {
    throw new Error(`Invalid path: ${path}`);
  }

  if (orderBy) {
    orderBy.forEach((sort: OrderBy) => {
      if (queryRef === null) {
        return;
      }

      if (sort.desc) {
        queryRef = queryRef.orderBy(sort.field, 'desc');
      } else {
        queryRef = queryRef.orderBy(sort.field);
      }
    });
  }

  if (limit) {
    queryRef = queryRef.limit(limit);
  }

  if (where) {
    where.forEach((whereClause) => {
      if (queryRef === null) {
        return;
      }

      queryRef = queryRef.where(whereClause.fieldPath, whereClause.opStr, whereClause.value);
    });
  }

  return queryRef.onSnapshot(
    (querySnapshot) => {
      if (!querySnapshot.forEach) {
        callback([]);
        return;
      }

      const items: firebase.firestore.DocumentData[] = [];
      querySnapshot.forEach((doc) => {
        items.push(doc.data());
      });

      callback(items);
    },
    function (err) {
      console.log('listen error', err, path);
    },
  );
}

/**
 * Get the firestore query ref
 * @param path firestore path
 */
function getQueryRefByPath(path: string): firebase.firestore.Query | null {
  let documentRef: firebase.firestore.DocumentReference | null = null;
  let collectionRef: firebase.firestore.CollectionReference | null = null;

  let isNextCollection = true;

  path.split('/').forEach((item) => {
    if (isNextCollection) {
      if (documentRef === null) {
        collectionRef = firestore.collection(item);
      } else {
        collectionRef = documentRef.collection(item);
      }

      isNextCollection = false;
    } else if (collectionRef !== null) {
      documentRef = collectionRef.doc(item);
      isNextCollection = true;
    }
  });

  return collectionRef;
}
