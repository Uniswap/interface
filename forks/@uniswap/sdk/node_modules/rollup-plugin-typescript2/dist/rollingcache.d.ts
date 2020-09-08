import { ICache } from "./icache";
/**
 * Saves data in new cache folder or reads it from old one.
 * Avoids perpetually growing cache and situations when things need to consider changed and then reverted data to be changed.
 */
export declare class RollingCache<DataType> implements ICache<DataType> {
    private cacheRoot;
    private checkNewCache;
    private oldCacheRoot;
    private newCacheRoot;
    private rolled;
    /**
     * @param cacheRoot: root folder for the cache
     * @param checkNewCache: whether to also look in new cache when reading from cache
     */
    constructor(cacheRoot: string, checkNewCache: boolean);
    /**
     * @returns true if name exist in old cache (or either old of new cache if checkNewCache is true)
     */
    exists(name: string): boolean;
    path(name: string): string;
    /**
     * @returns true if old cache contains all names and nothing more
     */
    match(names: string[]): boolean;
    /**
     * @returns data for name, must exist in old cache (or either old of new cache if checkNewCache is true)
     */
    read(name: string): DataType | null | undefined;
    write(name: string, data: DataType): void;
    touch(name: string): void;
    /**
     * clears old cache and moves new in its place
     */
    roll(): void;
}
//# sourceMappingURL=rollingcache.d.ts.map