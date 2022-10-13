declare type KeyAttributes = {
    threshold?: Ranking;
    maxRanking: Ranking;
    minRanking: Ranking;
};
interface RankingInfo {
    rankedValue: string;
    rank: Ranking;
    keyIndex: number;
    keyThreshold: Ranking | undefined;
}
interface ValueGetterKey<ItemType> {
    (item: ItemType): string | Array<string>;
}
interface IndexedItem<ItemType> {
    item: ItemType;
    index: number;
}
interface RankedItem<ItemType> extends RankingInfo, IndexedItem<ItemType> {
}
interface BaseSorter<ItemType> {
    (a: RankedItem<ItemType>, b: RankedItem<ItemType>): number;
}
interface Sorter<ItemType> {
    (matchItems: Array<RankedItem<ItemType>>): Array<RankedItem<ItemType>>;
}
interface KeyAttributesOptions<ItemType> {
    key?: string | ValueGetterKey<ItemType>;
    threshold?: Ranking;
    maxRanking?: Ranking;
    minRanking?: Ranking;
}
declare type KeyOption<ItemType> = KeyAttributesOptions<ItemType> | ValueGetterKey<ItemType> | string;
interface MatchSorterOptions<ItemType = unknown> {
    keys?: ReadonlyArray<KeyOption<ItemType>>;
    threshold?: Ranking;
    baseSort?: BaseSorter<ItemType>;
    keepDiacritics?: boolean;
    sorter?: Sorter<ItemType>;
}
declare const rankings: {
    readonly CASE_SENSITIVE_EQUAL: 7;
    readonly EQUAL: 6;
    readonly STARTS_WITH: 5;
    readonly WORD_STARTS_WITH: 4;
    readonly CONTAINS: 3;
    readonly ACRONYM: 2;
    readonly MATCHES: 1;
    readonly NO_MATCH: 0;
};
declare type Ranking = typeof rankings[keyof typeof rankings];
declare const defaultBaseSortFn: BaseSorter<unknown>;
/**
 * Takes an array of items and a value and returns a new array with the items that match the given value
 * @param {Array} items - the items to sort
 * @param {String} value - the value to use for ranking
 * @param {Object} options - Some options to configure the sorter
 * @return {Array} - the new sorted array
 */
declare function matchSorter<ItemType = string>(items: ReadonlyArray<ItemType>, value: string, options?: MatchSorterOptions<ItemType>): Array<ItemType>;
declare namespace matchSorter {
    var rankings: {
        readonly CASE_SENSITIVE_EQUAL: 7;
        readonly EQUAL: 6;
        readonly STARTS_WITH: 5;
        readonly WORD_STARTS_WITH: 4;
        readonly CONTAINS: 3;
        readonly ACRONYM: 2;
        readonly MATCHES: 1;
        readonly NO_MATCH: 0;
    };
}
export { matchSorter, rankings, defaultBaseSortFn };
export type { MatchSorterOptions, KeyAttributesOptions, KeyOption, KeyAttributes, RankingInfo, ValueGetterKey, };
