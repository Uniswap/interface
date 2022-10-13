import { PersistedClient } from './persist';
export declare type PersistRetryer = (props: {
    persistedClient: PersistedClient;
    error: Error;
    errorCount: number;
}) => PersistedClient | undefined;
export declare const removeOldestQuery: PersistRetryer;
