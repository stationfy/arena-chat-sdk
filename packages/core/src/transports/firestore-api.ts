import { OrderBy, ListenChangeConfig } from '@arena-im/chat-types';
import { initializeApp, getApps } from 'firebase/app';
import {
  CollectionReference,
  DocumentData,
  initializeFirestore,
  collection,
  onSnapshot,
  orderBy,
  QueryConstraint,
  limit,
  where,
  query,
  endAt,
  startAt,
  doc,
  getDoc,
  setDoc,
  DocumentChange,
} from 'firebase/firestore';
import { SyncPromise } from '../utils/syncpromise';
import CoreConfig from '@arena-im/config-sdk';


const firebase_apikey = CoreConfig.enviroment?.FIREBASE_APIKEY
const firebase_authdomain = CoreConfig.enviroment?.FIREBASE_AUTHDOMAIN
const firebase_project_id = CoreConfig.enviroment?.FIREBASE_PROJECT_ID

const config = {
  apiKey: firebase_apikey,
  authDomain: firebase_authdomain,
  projectId: firebase_project_id,
};

//TODO check if CoreConfig is loaded...

let app;

if (getApps().length) {
  app = initializeApp(config, 'arena-firebase');
} else {
  app = initializeApp(config);
}

const firestore = initializeFirestore(app, {
  experimentalAutoDetectLongPolling: true,
});

/**
 * Listen to a collection on firestore
 *
 * @param options Listen config
 * @param callback
 */
export function listenToCollectionChange(
  listenChangeConfig: ListenChangeConfig,
  callback: (response: DocumentData) => void,
): () => void {
  const queryRef = collection(firestore, listenChangeConfig.path);

  if (queryRef === null) {
    throw new Error(`Invalid path: ${listenChangeConfig.path}`);
  }

  const contraints: QueryConstraint[] = [];
  if (listenChangeConfig.orderBy) {
    listenChangeConfig.orderBy.forEach((sort: OrderBy) => {
      if (queryRef === null) {
        return;
      }

      if (sort.desc) {
        contraints.push(orderBy(sort.field, 'desc'));
      } else {
        contraints.push(orderBy(sort.field));
      }
    });
  }

  if (listenChangeConfig.limit) {
    contraints.push(limit(listenChangeConfig.limit));
  } else {
    contraints.push(limit(1));
  }

  if (listenChangeConfig.where) {
    listenChangeConfig.where.forEach((whereClause) => {
      if (queryRef === null) {
        return;
      }

      // @ts-ignore
      contraints.push(where(whereClause.fieldPath, whereClause.opStr, whereClause.value));
    });
  }

  const listenQuery = query(queryRef, ...contraints);

  return onSnapshot(
    listenQuery,
    (querySnapshot) => {
      const results: DocumentData[] = [];

      querySnapshot.forEach((doc) => {
        results.push(doc.data());
      });

      callback(results);
    },
    function (err) {
      console.error('listen error', err, listenChangeConfig.path);
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
  path: string,
  callback: (response: DocumentData | undefined) => void,
): () => void {
  const queryRef = doc(firestore, path);

  if (queryRef === null) {
    throw new Error(`Invalid path: ${path}`);
  }

  return onSnapshot(
    queryRef,
    (querySnapshot) => {
      const result = querySnapshot.data();

      callback(result);
    },
    function (err) {
      console.error('listen error', err, path);
    },
  );
}

/**
 * Fetch the collection items
 *
 * @param options
 */
export function fetchCollectionItems(listenChangeConfig: ListenChangeConfig): PromiseLike<DocumentData[]> {
  return new SyncPromise<DocumentData[]>((resolve, reject) => {
    const queryRef = collection(firestore, listenChangeConfig.path);

    if (queryRef === null) {
      throw new Error(`Invalid path: ${listenChangeConfig.path}`);
    }

    const contraints: QueryConstraint[] = [];
    if (listenChangeConfig.orderBy) {
      listenChangeConfig.orderBy.forEach((sort) => {
        if (sort.desc) {
          contraints.push(orderBy(sort.field, 'desc'));
        } else {
          contraints.push(orderBy(sort.field));
        }
      });
    }

    if (listenChangeConfig.endAt) {
      contraints.push(endAt(...listenChangeConfig.endAt));
    }

    if (listenChangeConfig.startAt) {
      contraints.push(startAt(...listenChangeConfig.startAt));
    }

    if (listenChangeConfig.limit) {
      contraints.push(limit(listenChangeConfig.limit));
    } else {
      contraints.push(limit(1));
    }

    if (listenChangeConfig.where) {
      listenChangeConfig.where.forEach((whereClause) => {
        // @ts-ignore
        contraints.push(where(whereClause.fieldPath, whereClause.opStr, whereClause.value));
      });
    }

    const queryCollectionItems = query(queryRef, ...contraints);

    return onSnapshot(
      queryCollectionItems,
      (querySnapshot) => {
        const results: DocumentData[] = [];

        querySnapshot.forEach((doc) => {
          results.push(doc.data());
        });

        resolve(results);
      },
      function (error) {
        reject(error);
      },
    );
  });
}

/**
 * Fetch the collection items
 *
 * @param options
 */
export function fetchDocument(path: string): PromiseLike<DocumentData> {
  return new SyncPromise<DocumentData>((resolve) => {
    const queryRef = doc(firestore, path);

    if (queryRef === null) {
      throw new Error(`Invalid path: ${path}`);
    }

    getDoc(queryRef).then((queryDocument) => {
      if (!queryDocument.exists) {
        resolve(null);
      }

      resolve(queryDocument.data());
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
  listenChangeConfig: ListenChangeConfig,
  callback: (response: DocumentChange<DocumentData>[]) => void,
): () => void {
  const queryRef = collection(firestore, listenChangeConfig.path);

  if (queryRef === null) {
    throw new Error(`Invalid path: ${listenChangeConfig.path}`);
  }

  const contraints: QueryConstraint[] = [];

  if (listenChangeConfig.orderBy) {
    listenChangeConfig.orderBy.forEach((sort: OrderBy) => {
      if (sort.desc) {
        contraints.push(orderBy(sort.field, 'desc'));
      } else {
        contraints.push(orderBy(sort.field));
      }
    });
  }

  if (listenChangeConfig.limit) {
    contraints.push(limit(listenChangeConfig.limit));
  } else {
    contraints.push(limit(1));
  }

  if (listenChangeConfig.where) {
    listenChangeConfig.where.forEach((whereClause) => {
      // @ts-ignore
      contraints.push(where(whereClause.fieldPath, whereClause.opStr, whereClause.value));
    });
  }

  const queryDocument = query(queryRef, ...contraints);

  return onSnapshot(
    queryDocument,
    (querySnapshot) => {
      const changes = querySnapshot.docChanges();

      callback(changes);
    },
    function (err) {
      console.error('listen error', err, listenChangeConfig.path);
    },
  );
}

/**
 *
 * @param path
 * @param value
 */
export function addItem(path: string, value: { [key: string]: any }): Promise<{ [key: string]: any }> {
  return new Promise((resolve, reject) => {
    const collectionRef = collection(firestore, path) as CollectionReference;

    if (collectionRef === null) {
      throw new Error(`Invalid path: ${path}`);
    }

    doc(firestore, path);

    const docRef = doc(firestore, path);
    value.key = docRef.id;

    return setDoc(docRef, value)
      .then(() => {
        resolve(value);
      })
      .catch(reject);
  });
}
