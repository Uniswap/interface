import React from 'react';
import { useSyncExternalStore } from "./useSyncExternalStore.mjs";
import { notifyManager } from "../core/notifyManager.mjs";
import { parseMutationFilterArgs } from "../core/utils.mjs";
import { useQueryClient } from "./QueryClientProvider.mjs";
export function useIsMutating(arg1, arg2, arg3) {
  const [filters, options = {}] = parseMutationFilterArgs(arg1, arg2, arg3);
  const queryClient = useQueryClient({
    context: options.context
  });
  const queryCache = queryClient.getQueryCache();
  return useSyncExternalStore(React.useCallback(onStoreChange => queryCache.subscribe(notifyManager.batchCalls(onStoreChange)), [queryCache]), () => queryClient.isMutating(filters), () => queryClient.isMutating(filters));
}