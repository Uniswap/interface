import type { CacheFs } from '../../../shared/lib/utils';
import { PrerenderManifest } from '../../../build';
import { IncrementalCacheValue, IncrementalCacheEntry } from '../../response-cache';
export interface CacheHandlerContext {
    fs: CacheFs;
    dev?: boolean;
    flushToDisk?: boolean;
    serverDistDir: string;
    maxMemoryCacheSize?: number;
    _appDir?: boolean;
}
export interface CacheHandlerValue {
    lastModified?: number;
    value: IncrementalCacheValue | null;
}
export declare class CacheHandler {
    constructor(_ctx: CacheHandlerContext);
    get(_key: string): Promise<CacheHandlerValue | null>;
    set(_key: string, _data: IncrementalCacheValue | null): Promise<void>;
}
export declare class IncrementalCache {
    dev?: boolean;
    cacheHandler: CacheHandler;
    prerenderManifest: PrerenderManifest;
    constructor({ fs, dev, appDir, flushToDisk, serverDistDir, maxMemoryCacheSize, getPrerenderManifest, incrementalCacheHandlerPath, }: {
        fs: CacheFs;
        dev: boolean;
        appDir?: boolean;
        serverDistDir: string;
        flushToDisk?: boolean;
        maxMemoryCacheSize?: number;
        incrementalCacheHandlerPath?: string;
        getPrerenderManifest: () => PrerenderManifest;
    });
    private calculateRevalidate;
    _getPathname(pathname: string): string;
    get(pathname: string): Promise<IncrementalCacheEntry | null>;
    set(pathname: string, data: IncrementalCacheValue | null, revalidateSeconds?: number | false): Promise<void>;
}
