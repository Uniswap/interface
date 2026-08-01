import { type PlainMessage } from '@bufbuild/protobuf'
import { useQueries } from '@tanstack/react-query'
import type { GetEarnPositionResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import { getEarnPositionQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/earn/queries'
import type { EarnVaultInfo } from 'uniswap/src/features/earn/types'

// lifetime_pnl_usd is only on GetEarnPosition (not ListEarnPositions), so fan out per vault
// and sum client-side.
const selectLifetimePnlUsd = (data: PlainMessage<GetEarnPositionResponse> | undefined): number | undefined =>
  data?.position?.lifetimePnlUsd

interface UseEarnLifetimeEarningsUsdParams {
  walletAddress: string | undefined
  vaults: readonly Pick<EarnVaultInfo, 'vaultAddress' | 'chainId'>[]
  enabled?: boolean
}

interface UseEarnLifetimeEarningsUsdResult {
  lifetimeEarningsUsd: number
  isLoading: boolean
  /** True when any per-vault rewards query failed; the summed value is then incomplete. */
  isError: boolean
}

// Use `combine` so React Query owns a stable output reference across renders.
const combineLifetimePnlResults = (
  results: { data: number | undefined; isLoading: boolean; isError: boolean }[],
): UseEarnLifetimeEarningsUsdResult => {
  let lifetimeEarningsUsd = 0
  let isLoading = false
  let isError = false
  for (const result of results) {
    if (typeof result.data === 'number') {
      lifetimeEarningsUsd += result.data
    }
    if (result.isLoading) {
      isLoading = true
    }
    if (result.isError) {
      isError = true
    }
  }
  return {
    lifetimeEarningsUsd,
    isLoading,
    isError,
  }
}

export function useEarnLifetimeEarningsUsd({
  walletAddress,
  vaults,
  enabled = true,
}: UseEarnLifetimeEarningsUsdParams): UseEarnLifetimeEarningsUsdResult {
  const queries = useMemo(
    () =>
      walletAddress && enabled
        ? vaults.map((vault) =>
            getEarnPositionQueryOptions({
              params: { walletAddress, vaultAddress: vault.vaultAddress, chainId: vault.chainId },
              select: selectLifetimePnlUsd,
            }),
          )
        : [],
    [walletAddress, enabled, vaults],
  )

  return useQueries({ queries, combine: combineLifetimePnlResults })
}
