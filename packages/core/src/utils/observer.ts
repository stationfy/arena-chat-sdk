export type Listerner<T> = (event: T) => void;

export function createObserver<T>(name?: string): {
  subscribe: (listerner: Listerner<T>) => () => void;
  publish: (event: T) => void;
} {
  let listeners: Listerner<T>[] = [];

  return {
    subscribe: (listener: Listerner<T>): (() => void) => {
      listeners.push(listener);
      if (name) {
        console.log({ name, listeners });
      }
      return () => {
        listeners = listeners.filter((l) => l !== listener);
      };
    },
    publish: (event: T) => {
      listeners.forEach((listener) => listener(event));
    },
  };
}
