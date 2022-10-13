/**
 * this is a set which automatically forgets
 * a given entry when a new entry is set and the ttl
 * of the old one is over
 */
export declare class ObliviousSet<T = any> {
    readonly ttl: number;
    readonly set: Set<unknown>;
    readonly timeMap: Map<any, any>;
    constructor(ttl: number);
    has(value: T): boolean;
    add(value: T): void;
    clear(): void;
}
/**
 * Removes all entries from the set
 * where the TTL has expired
 */
export declare function removeTooOldValues(obliviousSet: ObliviousSet): void;
export declare function now(): number;
