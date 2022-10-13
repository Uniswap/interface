import { QueryFilters } from './utils';
import { Action, Query, QueryState } from './query';
import type { QueryKey, QueryOptions } from './types';
import type { QueryClient } from './queryClient';
import { Subscribable } from './subscribable';
import { QueryObserver } from './queryObserver';
interface QueryCacheConfig {
    onError?: (error: unknown, query: Query<unknown, unknown, unknown>) => void;
    onSuccess?: (data: unknown, query: Query<unknown, unknown, unknown>) => void;
}
interface NotifyEventQueryAdded {
    type: 'added';
    query: Query<any, any, any, any>;
}
interface NotifyEventQueryRemoved {
    type: 'removed';
    query: Query<any, any, any, any>;
}
interface NotifyEventQueryUpdated {
    type: 'updated';
    query: Query<any, any, any, any>;
    action: Action<any, any>;
}
interface NotifyEventQueryObserverAdded {
    type: 'observerAdded';
    query: Query<any, any, any, any>;
    observer: QueryObserver<any, any, any, any, any>;
}
interface NotifyEventQueryObserverRemoved {
    type: 'observerRemoved';
    query: Query<any, any, any, any>;
    observer: QueryObserver<any, any, any, any, any>;
}
interface NotifyEventQueryObserverResultsUpdated {
    type: 'observerResultsUpdated';
    query: Query<any, any, any, any>;
}
declare type QueryCacheNotifyEvent = NotifyEventQueryAdded | NotifyEventQueryRemoved | NotifyEventQueryUpdated | NotifyEventQueryObserverAdded | NotifyEventQueryObserverRemoved | NotifyEventQueryObserverResultsUpdated;
declare type QueryCacheListener = (event: QueryCacheNotifyEvent) => void;
export declare class QueryCache extends Subscribable<QueryCacheListener> {
    config: QueryCacheConfig;
    private queries;
    private queriesMap;
    constructor(config?: QueryCacheConfig);
    build<TQueryFnData, TError, TData, TQueryKey extends QueryKey>(client: QueryClient, options: QueryOptions<TQueryFnData, TError, TData, TQueryKey>, state?: QueryState<TData, TError>): Query<TQueryFnData, TError, TData, TQueryKey>;
    add(query: Query<any, any, any, any>): void;
    remove(query: Query<any, any, any, any>): void;
    clear(): void;
    get<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData, TQueyKey extends QueryKey = QueryKey>(queryHash: string): Query<TQueryFnData, TError, TData, TQueyKey> | undefined;
    getAll(): Query[];
    find<TQueryFnData = unknown, TError = unknown, TData = TQueryFnData>(arg1: QueryKey, arg2?: QueryFilters): Query<TQueryFnData, TError, TData> | undefined;
    findAll(queryKey?: QueryKey, filters?: QueryFilters): Query[];
    findAll(filters?: QueryFilters): Query[];
    findAll(arg1?: QueryKey | QueryFilters, arg2?: QueryFilters): Query[];
    notify(event: QueryCacheNotifyEvent): void;
    onFocus(): void;
    onOnline(): void;
}
export {};
