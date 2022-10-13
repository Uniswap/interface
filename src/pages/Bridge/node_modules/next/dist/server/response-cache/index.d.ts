import type { IncrementalCache, ResponseCacheEntry, ResponseGenerator } from './types';
export * from './types';
export default class ResponseCache {
    incrementalCache: IncrementalCache;
    pendingResponses: Map<string, Promise<ResponseCacheEntry | null>>;
    previousCacheItem?: {
        key: string;
        entry: ResponseCacheEntry | null;
        expiresAt: number;
    };
    minimalMode?: boolean;
    constructor(incrementalCache: IncrementalCache, minimalMode: boolean);
    get(key: string | null, responseGenerator: ResponseGenerator, context: {
        isManualRevalidate?: boolean;
        isPrefetch?: boolean;
    }): Promise<ResponseCacheEntry | null>;
}
