import { ContextOptions } from './types';
import { QueryKey } from '../core';
import { QueryFilters } from '../core/utils';
interface Options extends ContextOptions {
}
export declare function useIsFetching(filters?: QueryFilters, options?: Options): number;
export declare function useIsFetching(queryKey?: QueryKey, filters?: QueryFilters, options?: Options): number;
export {};
