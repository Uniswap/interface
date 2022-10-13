// Side effects
import "./setBatchUpdatesFn.mjs";
export { defaultContext, QueryClientProvider, useQueryClient } from "./QueryClientProvider.mjs";
export { QueryErrorResetBoundary, useQueryErrorResetBoundary } from "./QueryErrorResetBoundary.mjs";
export { useIsFetching } from "./useIsFetching.mjs";
export { useIsMutating } from "./useIsMutating.mjs";
export { useMutation } from "./useMutation.mjs";
export { useQuery } from "./useQuery.mjs";
export { useQueries } from "./useQueries.mjs";
export { useInfiniteQuery } from "./useInfiniteQuery.mjs";
export { useHydrate, Hydrate } from "./Hydrate.mjs";
export { useIsRestoring } from "./isRestoring.mjs"; // Types

export * from "./types.mjs";