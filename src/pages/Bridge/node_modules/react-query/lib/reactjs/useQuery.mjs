import { QueryObserver } from "../core/index.mjs";
import { parseQueryArgs } from "../core/utils.mjs";
import { useBaseQuery } from "./useBaseQuery.mjs"; // HOOK

export function useQuery(arg1, arg2, arg3) {
  const parsedOptions = parseQueryArgs(arg1, arg2, arg3);
  return useBaseQuery(parsedOptions, QueryObserver);
}