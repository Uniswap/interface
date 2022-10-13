import { PersistedClient, Persister, PersistRetryer } from '../persistQueryClient';
interface Storage {
    getItem: (key: string) => string | null;
    setItem: (key: string, value: string) => void;
    removeItem: (key: string) => void;
}
interface CreateWebStoragePersisterOptions {
    /** The storage client used for setting and retrieving items from cache.
     * For SSR pass in `undefined`.
     */
    storage: Storage | undefined;
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
    retry?: PersistRetryer;
}
export declare function createWebStoragePersister({ storage, key, throttleTime, serialize, deserialize, retry, }: CreateWebStoragePersisterOptions): Persister;
export {};
