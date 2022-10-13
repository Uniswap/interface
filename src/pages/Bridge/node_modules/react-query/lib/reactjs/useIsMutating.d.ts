import { MutationKey } from '../core/types';
import { ContextOptions } from '../reactjs/types';
import { MutationFilters } from '../core/utils';
interface Options extends ContextOptions {
}
export declare function useIsMutating(filters?: MutationFilters, options?: Options): number;
export declare function useIsMutating(mutationKey?: MutationKey, filters?: Omit<MutationFilters, 'mutationKey'>, options?: Options): number;
export {};
