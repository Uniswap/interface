import { ICache } from "./icache";
export declare class NoCache<DataType> implements ICache<DataType> {
    exists(_name: string): boolean;
    path(name: string): string;
    match(_names: string[]): boolean;
    read(_name: string): DataType | null | undefined;
    write(_name: string, _data: DataType): void;
    touch(_name: string): void;
    roll(): void;
}
//# sourceMappingURL=nocache.d.ts.map