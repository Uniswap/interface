import { QueryKey, QueryObserver } from '../core';
import { UseBaseQueryOptions } from './types';
export declare function useBaseQuery<TQueryFnData, TError, TData, TQueryData, TQueryKey extends QueryKey>(options: UseBaseQueryOptions<TQueryFnData, TError, TData, TQueryData, TQueryKey>, Observer: typeof QueryObserver): import("../core").QueryObserverResult<TData, TError>;
