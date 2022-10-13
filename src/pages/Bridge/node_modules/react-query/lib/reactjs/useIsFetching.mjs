import React from 'react';
import { useSyncExternalStore } from "./useSyncExternalStore.mjs";
import { notifyManager } from "../core/index.mjs";
import { parseFilterArgs } from "../core/utils.mjs";
import { useQueryClient } from "./QueryClientProvider.mjs";
export function useIsFetching(arg1, arg2, arg3) {
  const [filters, options = {}] = parseFilterArgs(arg1, arg2, arg3);
  const queryClient = useQueryClient({
    context: options.context
  });
  const queryCache = queryClient.getQueryCache();
  return useSyncExternalStore(React.useCallback(onStoreChange => queryCache.subscribe(notifyManager.batchCalls(onStoreChange)), [queryCache]), () => queryClient.isFetching(filters), () => queryClient.isFetching(filters));
}