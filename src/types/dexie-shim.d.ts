declare module 'dexie' {
  export type Table<T = any, TKey = any, TInsertType = T> = any;

  export default class Dexie {
    constructor(name?: string);
    version(versionNumber: number): {
      stores(schema: Record<string, string>): void;
    };
    open(): Promise<void>;
    close(): void;
  }
}
