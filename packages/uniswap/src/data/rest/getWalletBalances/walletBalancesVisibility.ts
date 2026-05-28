import { type QueryClient } from '@tanstack/react-query'
import type { GetWalletBalancesResponse, WalletBalance } from '@uniswap/client-data-api/dist/data/v1/api_pb.d'
import {
  getWalletBalancesQuery,
  PortfolioBalancePart,
  type GetWalletBalancesInput,
} from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'

/** Adjusts a `BalanceComponent`'s `valueUsd` by a USD delta. 24h derivatives stay until the next refetch. */
function applyDeltaToBalanceComponent<TBalance extends { valueUsd?: number } | undefined>(
  component: TBalance,
  deltaUsd: number,
): TBalance {
  if (!component) {
    return component
  }
  return {
    ...component,
    valueUsd: (component.valueUsd ?? 0) + deltaUsd,
  }
}

/** Which side-part a visibility delta targets. `total` always moves; the off-side part never does. */
export type WalletBalancesVisibilityPart = PortfolioBalancePart.Tokens | PortfolioBalancePart.Pools

/** Args for the writer returned by `createWalletBalancesVisibilityUpdater`. */
export type WalletBalancesVisibilityDeltaArgs = {
  input: GetWalletBalancesInput['input']
  deltaUsd: number
  part: WalletBalancesVisibilityPart
}

/**
 * Applies a USD delta to `total` and the given side-part; the off-side part is left untouched.
 *
 * Cast through `unknown` because the proto-generated `WalletBalance` class carries methods that
 * the spread loses. Read paths only touch numeric fields, so the runtime contract is preserved.
 */
export function applyWalletBalancesVisibilityDelta({
  data,
  deltaUsd,
  part,
}: {
  data: GetWalletBalancesResponse | undefined
  deltaUsd: number
  part: WalletBalancesVisibilityPart
}): GetWalletBalancesResponse | undefined {
  if (!data?.balance) {
    return data
  }
  const balance = data.balance
  const updatedBalance = {
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...balance,
    total: applyDeltaToBalanceComponent(balance.total, deltaUsd),
    [part]: applyDeltaToBalanceComponent(balance[part], deltaUsd),
  } as unknown as WalletBalance
  return {
    // oxlint-disable-next-line typescript/no-misused-spread -- biome-parity: oxlint is stricter here
    ...data,
    balance: updatedBalance,
  } as GetWalletBalancesResponse
}

/**
 * Returns a writer that mutates the exact cache entry for the given `input`. Manual mutation is
 * required because `modifier` is excluded from the cache key, so hide/unhide doesn't invalidate
 * this cache naturally; an optimistic mutation here keeps the Overview header consistent until
 * the next poll. Exact-key targeting (vs a broad address/platform scan) avoids double-counting
 * on combined-address queries and cross-platform/chain leakage. Broad scans remain appropriate
 * for `invalidateQueries`.
 */
export function createWalletBalancesVisibilityUpdater(
  queryClient: QueryClient,
): (args: WalletBalancesVisibilityDeltaArgs) => void {
  return ({ input, deltaUsd, part }) => {
    const queryKey = getWalletBalancesQuery({ input }).queryKey
    queryClient.setQueryData<GetWalletBalancesResponse>(queryKey, (old) =>
      applyWalletBalancesVisibilityDelta({ data: old, deltaUsd, part }),
    )
  }
}
