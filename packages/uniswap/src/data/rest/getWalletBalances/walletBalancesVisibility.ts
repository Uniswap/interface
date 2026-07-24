import { type QueryClient } from '@tanstack/react-query'
import type { GetWalletBalancesResponse, WalletBalance } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import {
  getWalletBalancesQuery,
  PortfolioBalancePart,
  type GetWalletBalancesInput,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Adjusts a `BalanceComponent`'s `valueUsd` by `deltaUsd` and, when `countDelta` is non-zero,
 * its `count`. Both are clamped at 0 when present. When the BE omitted a field (undefined),
 * the writer preserves it as undefined rather than fabricating 0 — otherwise the header's
 * dash placeholder would flip to a literal 0 on toggle.
 */
function applyDeltaToBalanceComponent<TBalance extends { valueUsd?: number; count?: number } | undefined>({
  component,
  deltaUsd,
  countDelta = 0,
}: {
  component: TBalance
  deltaUsd: number
  countDelta?: number
}): TBalance {
  if (!component) {
    return component
  }
  return {
    ...component,
    valueUsd: component.valueUsd === undefined ? undefined : Math.max(0, component.valueUsd + deltaUsd),
    count:
      countDelta === 0 || component.count === undefined ? component.count : Math.max(0, component.count + countDelta),
  }
}

/** Which side-part a visibility delta targets. `total` always moves; the off-side part never does. */
export type WalletBalancesVisibilityPart = PortfolioBalancePart.Tokens | PortfolioBalancePart.Pools

/** Args for the writer returned by `createWalletBalancesVisibilityUpdater`. */
export type WalletBalancesVisibilityDeltaArgs = {
  input: GetWalletBalancesInput['input']
  deltaUsd: number
  /** Optional ±N adjustment to the side-part's `count`. `total.count` is not exposed and is left untouched. */
  countDelta?: number
  part: WalletBalancesVisibilityPart
  /**
   * When provided, the writer broad-scans the cache and applies the delta to every cached
   * entry that matches the wallet's address AND has this chain in its `chainIds`. Required
   * for pool-side writes where the rendered query may be chain-filtered (`chainIds=[chainId]`)
   * while the writer was constructed against the all-chains list — exact-key targeting in
   * that case writes to an entry the UI is not subscribed to. When omitted, falls back to
   * exact-key targeting (the original token-side behavior).
   */
  scanChainId?: number
}

type WalletBalancesQueryKey = readonly [
  ReactQueryCacheKey.GetWalletBalances,
  { evmAddress?: string; svmAddress?: string },
  { chainIds?: number[] },
]

/**
 * Type guard that narrows a React Query key to the GetWalletBalances tuple shape.
 * Centralizing the structural check here lets `matchesWalletAndChain` work without
 * any local casts — TypeScript narrows `queryKey` once the guard returns true.
 */
function isWalletBalancesQueryKey(queryKey: readonly unknown[]): queryKey is WalletBalancesQueryKey {
  return (
    queryKey.length >= 3 &&
    queryKey[0] === ReactQueryCacheKey.GetWalletBalances &&
    typeof queryKey[1] === 'object' &&
    queryKey[1] !== null &&
    typeof queryKey[2] === 'object' &&
    queryKey[2] !== null
  )
}

function matchesWalletAndChain({
  queryKey,
  input,
  chainId,
}: {
  queryKey: readonly unknown[]
  input: GetWalletBalancesInput['input']
  chainId: number
}): boolean {
  if (!isWalletBalancesQueryKey(queryKey)) {
    return false
  }
  const [, addressKey, queryCacheInputs] = queryKey
  const evmMatches = !!input?.evmAddress && addressKey.evmAddress === input.evmAddress
  const svmMatches = !!input?.svmAddress && addressKey.svmAddress === input.svmAddress
  if (!evmMatches && !svmMatches) {
    return false
  }
  const cachedChainIds = queryCacheInputs.chainIds
  if (!cachedChainIds || cachedChainIds.length === 0) {
    return true
  }
  return cachedChainIds.includes(chainId)
}

/**
 * Applies a USD delta to `total` and the given side-part; the off-side part is left untouched.
 * When `countDelta` is non-zero it is also applied to the side-part's `count` (never to `total`).
 *
 * Cast through `unknown` because the proto-generated `WalletBalance` class carries methods that
 * the spread loses. Read paths only touch numeric fields, so the runtime contract is preserved.
 */
export function applyWalletBalancesVisibilityDelta({
  data,
  deltaUsd,
  countDelta = 0,
  part,
}: {
  data: GetWalletBalancesResponse | undefined
  deltaUsd: number
  countDelta?: number
  part: WalletBalancesVisibilityPart
}): GetWalletBalancesResponse | undefined {
  if (!data?.balance) {
    return data
  }
  const balance = data.balance
  const updatedBalance = {
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...balance,
    total: applyDeltaToBalanceComponent({ component: balance.total, deltaUsd }),
    [part]: applyDeltaToBalanceComponent({ component: balance[part], deltaUsd, countDelta }),
  } as unknown as WalletBalance
  return {
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...data,
    balance: updatedBalance,
  } as GetWalletBalancesResponse
}

/**
 * Returns a writer that optimistically mutates cached `GetWalletBalances` entries to keep
 * the header consistent until the next poll. `modifier` is excluded from the query key, so
 * hide/unhide doesn't invalidate this cache naturally — this bridges the visual gap.
 *
 * Two modes:
 *
 * - **Exact-key (default, token side)**: when `scanChainId` is omitted, writes only to the
 *   entry whose key matches `input` exactly. Same behavior as the original implementation.
 *
 * - **Broad scan (pool side)**: when `scanChainId` is set, writes to every cached entry whose
 *   address matches AND whose `chainIds` includes `scanChainId`. Required because the rendered
 *   query may be chain-filtered (`chainIds=[chainId]`) while the writer was built with the
 *   all-chains list — exact-key would write to the wrong entry. Empty/missing cached `chainIds`
 *   are treated as "all chains", so they always match.
 */
export function createWalletBalancesVisibilityUpdater(
  queryClient: QueryClient,
): (args: WalletBalancesVisibilityDeltaArgs) => void {
  return ({ input, deltaUsd, countDelta, part, scanChainId }) => {
    if (scanChainId === undefined) {
      const queryKey = getWalletBalancesQuery({ input }).queryKey
      queryClient.setQueryData<GetWalletBalancesResponse>(queryKey, (old) =>
        applyWalletBalancesVisibilityDelta({ data: old, deltaUsd, countDelta, part }),
      )
      return
    }
    queryClient.setQueriesData<GetWalletBalancesResponse>(
      {
        predicate: (query) => matchesWalletAndChain({ queryKey: query.queryKey, input, chainId: scanChainId }),
      },
      (old) => applyWalletBalancesVisibilityDelta({ data: old, deltaUsd, countDelta, part }),
    )
  }
}
