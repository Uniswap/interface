import { InfiniteQueryObserver } from "../core/infiniteQueryObserver.mjs";
import { parseQueryArgs } from "../core/utils.mjs";
import { useBaseQuery } from "./useBaseQuery.mjs"; // HOOK

export function useInfiniteQuery(arg1, arg2, arg3) {
  const options = parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery(options, InfiniteQueryObserver);
}