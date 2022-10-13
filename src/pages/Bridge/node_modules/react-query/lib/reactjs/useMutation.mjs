import React from 'react';
import { useSyncExternalStore } from "./useSyncExternalStore.mjs";
import { notifyManager } from "../core/index.mjs";
import { noop, parseMutationArgs } from "../core/utils.mjs";
import { MutationObserver } from "../core/mutationObserver.mjs";
import { useQueryClient } from "./QueryClientProvider.mjs";
import { shouldThrowError } from "./utils.mjs"; // HOOK

export function useMutation(arg1, arg2, arg3) {
  const options = parseMutationArgs(arg1, arg2, arg3);
  const queryClient = useQueryClient({
    context: options.context
  });
  const [observer] = React.useState(() => new MutationObserver(queryClient, options));
  React.useEffect(() => {
    observer.setOptions(options);
  }, [observer, options]);
  const result = useSyncExternalStore(React.useCallback(onStoreChange => observer.subscribe(notifyManager.batchCalls(onStoreChange)), [observer]), () => observer.getCurrentResult(), () => observer.getCurrentResult());
  const mutate = React.useCallback((variables, mutateOptions) => {
    observer.mutate(variables, mutateOptions).catch(noop);
  }, [observer]);

  if (result.error && shouldThrowError(observer.options.useErrorBoundary, [result.error])) {
    throw result.error;
  }

  return { ...result,
    mutate,
    mutateAsync: result.mutate
  };
}