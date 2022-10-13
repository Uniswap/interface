import { PersistedClient, Persister, Promisable } from '../persistQueryClient';
interface AsyncStorage {
    getItem: (key: string) => Promise<string | null>;
    setItem: (key: string, value: string) => Promise<void>;
    removeItem: (key: string) => Promise<void>;
}
export declare type AsyncPersistRetryer = (props: {
    persistedClient: PersistedClient;
    error: Error;
    errorCount: number;
}) => Promisable<PersistedClient | undefined>;
interface CreateAsyncStoragePersisterOptions {
    /** The storage client used for setting and retrieving items from cache.
     * For SSR pass in `undefined`.
     */
    storage: AsyncStorage | undefined;
    /** The key to use when storing the cache */
    key?: string;
    /** To avoid spamming,
     * pass a time in ms to throttle saving the cache to disk */
    throttleTime?: number;
    /**
     * How to serialize the data to storage.
     * @default `JSON.stringify`
     */
    serialize?: (client: PersistedClient) => string;
    /**
     * How to deserialize the data from storage.
     * @default `JSON.parse`
     */
    deserialize?: (cachedString: string) => PersistedClient;
    retry?: AsyncPersistRetryer;
}
export declare const createAsyncStoragePersister: ({ storage, key, throttleTime, serialize, deserialize, retry, }: CreateAsyncStoragePersisterOptions) => Persister;
export {};
