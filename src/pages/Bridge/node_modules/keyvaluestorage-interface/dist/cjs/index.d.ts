export declare abstract class IKeyValueStorage {
    abstract getKeys(): Promise<string[]>;
    abstract getEntries<T = any>(): Promise<[string, T][]>;
    abstract getItem<T = any>(key: string): Promise<T | undefined>;
    abstract setItem<T = any>(key: string, value: T): Promise<void>;
    abstract removeItem(key: string): Promise<void>;
}
//# sourceMappingURL=index.d.ts.map