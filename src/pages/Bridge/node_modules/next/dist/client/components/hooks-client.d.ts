export { FlushEffectsContext, useFlushEffects, } from '../../shared/lib/flush-effects';
/**
 * Get the current search params. For example useSearchParams() would return {"foo": "bar"} when ?foo=bar
 */
export declare function useSearchParams(): import("../../server/request-meta").NextParsedUrlQuery;
/**
 * Get an individual search param. For example useSearchParam("foo") would return "bar" when ?foo=bar
 */
export declare function useSearchParam(key: string): string | string[];
/**
 * Get the router methods. For example router.push('/dashboard')
 */
export declare function useRouter(): import('../../shared/lib/app-router-context').AppRouterInstance;
/**
 * Get the current pathname. For example usePathname() on /dashboard?foo=bar would return "/dashboard"
 */
export declare function usePathname(): string;
/**
 * Get the current segment one level down from the layout.
 */
export declare function useSelectedLayoutSegment(parallelRouteKey?: string): string;
