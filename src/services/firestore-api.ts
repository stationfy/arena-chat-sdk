import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { OrderBy, ListenChangeConfig } from '../models/firestore';
import { SyncPromise } from '../utils/syncpromise';
import { FIREBASE_APIKEY, FIREBASE_AUTHDOMAIN, FIREBASE_PROJECT_ID } from '../config';

const config = {
  apiKey: FIREBASE_APIKEY,
  authDomain: FIREBASE_AUTHDOMAIN,
  projectId: FIREBASE_PROJECT_ID,
};

// @ts-ignore
const app = firebase.initializeApp(config);

const firestore = app.firestore();

/**
 * Listen to a collection on firestore
 *
 * @param options Listen config
 * @param callback
 */
export function listenToCollectionChange(
  { path, limit, orderBy, where }: ListenChangeConfig,
  callback: (response: firebase.firestore.DocumentData[]) => void,
): () => void {
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
      const results: firebase.firestore.DocumentData[] = [];

      querySnapshot.forEach((doc) => {
        results.push(doc.data());
      });

      callback(results);
    },
    function (err) {
      console.log('listen error', err, path);
    },
  );
}

/**
 * Listen to a document on firestore
 *
 * @param options Listen config
 * @param callback
 */
export function listenToDocumentChange(
  { path, where }: ListenChangeConfig,
  callback: (response: firebase.firestore.DocumentData) => void,
): () => void {
  let queryRef = getQueryRefByPath(path);

  if (queryRef === null) {
    throw new Error(`Invalid path: ${path}`);
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
      // @ts-ignore
      const result = querySnapshot.data();

      callback(result);
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

  return isNextCollection ? documentRef : collectionRef;
}

/**
 * Fetch the collection items
 *
 * @param options
 */
export function fetchCollectionItems({
  path,
  orderBy,
  limit,
  startAt,
  endAt,
  where,
}: ListenChangeConfig): PromiseLike<firebase.firestore.DocumentData[]> {
  return new SyncPromise<firebase.firestore.DocumentData[]>((resolve, reject) => {
    let queryRef = getQueryRefByPath(path);

    if (queryRef === null) {
      throw new Error(`Invalid path: ${path}`);
    }

    if (orderBy) {
      orderBy.forEach((sort) => {
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

    if (endAt) {
      queryRef = queryRef.endAt(endAt);
    }

    if (startAt) {
      queryRef = queryRef.startAt(...startAt);
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

    queryRef
      .get()
      .then((querySnapshot) => {
        const results: firebase.firestore.DocumentData[] = [];

        querySnapshot.forEach((doc) => {
          results.push(doc.data());
        });

        resolve(results);
      })
      .catch((error) => {
        reject(error);
      });
  });
}

/**
 * Listen to a item changed on a collection
 *
 * @param options
 * @param callback
 */
export function listenToCollectionItemChange(
  { path, limit, orderBy, where }: ListenChangeConfig,
  callback: (response: firebase.firestore.DocumentData) => void,
): () => void {
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
      const changes = querySnapshot.docChanges();

      if (changes.length === 1) {
        const change = changes[0];
        const data = change.doc.data();

        data.changeType = change.type;

        callback(data);
      }
    },
    function (err) {
      console.log('listen error', err, path);
    },
  );
}
