import { TokenList } from '@uniswap/token-lists';
export interface ListsState {
    readonly byUrl: {
        readonly [url: string]: {
            readonly current: TokenList | null;
            readonly pendingUpdate: TokenList | null;
            readonly loadingRequestId: string | null;
            readonly error: string | null;
        };
    };
    readonly lastInitializedDefaultListOfLists?: string[];
    readonly activeListUrls: string[] | undefined;
}
declare const _default: import("redux").Reducer<ListsState, import("redux").AnyAction>;
export default _default;
