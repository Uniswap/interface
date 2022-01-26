import { EventFilter, Log } from './utils';
export interface LogsState {
    [chainId: number]: {
        [filterKey: string]: {
            listeners: number;
            fetchingBlockNumber?: number;
            results?: {
                blockNumber: number;
                logs: Log[];
                error?: undefined;
            } | {
                blockNumber: number;
                logs?: undefined;
                error: true;
            };
        };
    };
}
declare const _default: import("redux").Reducer<LogsState, import("redux").AnyAction>;
export default _default;
export declare const addListener: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    filter: EventFilter;
}, string>, removeListener: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    filter: EventFilter;
}, string>, fetchedLogs: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    filter: EventFilter;
    results: {
        blockNumber: number;
        logs: Log[];
    };
}, string>, fetchedLogsError: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    blockNumber: number;
    filter: EventFilter;
}, string>, fetchingLogs: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    chainId: number;
    filters: EventFilter[];
    blockNumber: number;
}, string>;
