import { useQuery } from '@tanstack/react-query'
import { HookListRequest, HookListResponse } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/api_pb'
import type { HookEntry } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { liquidityQueries } from 'uniswap/src/data/apiClients/liquidityService/liquidityQueries'

// The hooks registry (Uniswap/hooklist) is a small curated list, so fetch it whole and well above
// its size to avoid server-side pagination truncating it.
const HOOK_LIST_LIMIT = 1000

// Fetched lazily by the first consumer that mounts (staleTime/gcTime Infinity), then kept for the
// session so subsequent registry reads are synchronous cache hits.
export function hookRegistryQueryOptions() {
  return liquidityQueries.hookList({
    params: new HookListRequest({ limit: HOOK_LIST_LIMIT }),
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function getHookRegistryKey({ chainId, hookAddress }: { chainId: number; hookAddress: string }): string {
  return `${chainId}-${hookAddress.toLowerCase()}`
}

export function buildHookRegistryMap(data: HookListResponse): Map<string, HookEntry> {
  const map = new Map<string, HookEntry>()
  for (const hook of data.hooks) {
    map.set(getHookRegistryKey({ chainId: hook.chainId, hookAddress: hook.address }), hook)
  }
  return map
}

/**
 * Every known v4 hook, keyed by `getHookRegistryKey` (chainId + lowercased hook address) for O(1)
 * lookups. Undefined until the registry has loaded — callers should fall back to showing the raw
 * hook address.
 *
 * Pass `enabled: false` to defer the registry fetch until the consumer actually needs it.
 */
export function useHookRegistryMap({ enabled = true }: { enabled?: boolean } = {}): Map<string, HookEntry> | undefined {
  const { data } = useQuery({ ...hookRegistryQueryOptions(), select: buildHookRegistryMap, enabled })
  return data
}
