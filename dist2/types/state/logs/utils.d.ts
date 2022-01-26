export interface EventFilter {
    address?: string;
    topics?: Array<string | Array<string> | null>;
}
export interface Log {
    topics: Array<string>;
    data: string;
    transactionIndex: number;
    logIndex: number;
    blockNumber: number;
}
/**
 * Converts a filter to the corresponding string key
 * @param filter the filter to convert
 */
export declare function filterToKey(filter: EventFilter): string;
/**
 * Convert a filter key to the corresponding filter
 * @param key key to convert
 */
export declare function keyToFilter(key: string): EventFilter;
