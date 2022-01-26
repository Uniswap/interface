import { EventFilter, Log } from './utils';
export declare enum LogsState {
    INVALID = 0,
    LOADING = 1,
    SYNCING = 2,
    ERROR = 3,
    SYNCED = 4
}
export interface UseLogsResult {
    logs: Log[] | undefined;
    state: LogsState;
}
/**
 * Returns the logs for the given filter as of the latest block, re-fetching from the library every block.
 * @param filter The logs filter, without `blockHash`, `fromBlock` or `toBlock` defined.
 * The filter parameter should _always_ be memoized, or else will trigger constant refetching
 */
export declare function useLogs(filter: EventFilter | undefined): UseLogsResult;
