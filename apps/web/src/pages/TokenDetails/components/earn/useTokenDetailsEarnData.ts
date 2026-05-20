import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import {
  getListEarnPositionsQueryOptions,
  getListEarnVaultsQueryOptions,
} from 'uniswap/src/data/apiClients/dataApiService/earn'
import { EARN_SUPPORTED_CHAIN_IDS } from 'uniswap/src/features/earn/constants'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getEarnPositionInfosByVaultId,
  getEarnVaultInfos,
  getProjectedAnnualEarningsUsd,
  getTokenBalanceUsd,
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  selectEarnVaultForToken,
} from 'uniswap/src/features/earn/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { useActiveAccount } from '~/features/accounts/store/hooks'
import { getAggregateTokenBalance } from '~/pages/TokenDetails/components/earn/utils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export type TokenDetailsEarnData = {
  balanceUsd: number | undefined
  earnPosition: EarnPositionInfo | undefined
  earnVault: EarnVaultInfo | undefined
  hasLoadedPositions: boolean
  isLoggedIn: boolean
  projectedAnnualEarningsUsd: number | undefined
  tokenSymbol: string
  userHasEarnPosition: boolean
}

export function useTokenDetailsEarnData({
  enabled,
  tokenQueryData,
}: {
  enabled: boolean
  tokenQueryData: TokenQueryData | undefined
}): TokenDetailsEarnData {
  const evmAccount = useActiveAccount(Platform.EVM)

  const { multiChainMap } = useTDPStore((s) => ({
    multiChainMap: s.multiChainMap,
  }))

  const tokenCurrencyIds = useMemo(
    () => getTokenProjectCurrencyIds(tokenQueryData?.project?.tokens),
    [tokenQueryData?.project?.tokens],
  )
  const aggregateBalance = useMemo(() => getAggregateTokenBalance(multiChainMap), [multiChainMap])
  const vaultsQueryParams = useMemo(() => ({ chainIds: EARN_SUPPORTED_CHAIN_IDS }), [])
  const positionsQueryParams = useMemo(
    () =>
      evmAccount?.address
        ? {
            walletAddress: evmAccount.address,
            chainIds: EARN_SUPPORTED_CHAIN_IDS,
          }
        : undefined,
    [evmAccount?.address],
  )

  const vaultsQuery = useQuery(
    getListEarnVaultsQueryOptions({
      params: vaultsQueryParams,
      enabled: enabled && tokenCurrencyIds.length > 0,
    }),
  )
  const positionsQuery = useQuery(
    getListEarnPositionsQueryOptions({
      params: positionsQueryParams,
      enabled: enabled && tokenCurrencyIds.length > 0 && !!positionsQueryParams,
    }),
  )

  const earnVaults = useMemo(() => getEarnVaultInfos(vaultsQuery.data?.vaults), [vaultsQuery.data?.vaults])
  const positionsByVaultId = useMemo(
    () => getEarnPositionInfosByVaultId(positionsQuery.data?.positions),
    [positionsQuery.data?.positions],
  )
  const earnVault = useMemo(
    () => selectEarnVaultForToken({ tokenCurrencyIds, vaults: earnVaults }),
    [earnVaults, tokenCurrencyIds],
  )
  const earnPosition = earnVault ? positionsByVaultId.get(earnVault.id) : undefined
  const isLoggedIn = !!evmAccount?.address
  const hasLoadedPositions = positionsQuery.isSuccess
  const userHasEarnPosition = hasLoadedPositions && hasEarnPosition(earnPosition)
  const balanceUsd = getTokenBalanceUsd({
    balance: aggregateBalance,
    tokenPriceUsd: tokenQueryData?.market?.price?.value,
  })
  const projectedAnnualEarningsUsd = earnVault
    ? getProjectedAnnualEarningsUsd({
        balanceUsd: balanceUsd ?? 0,
        apyPercent: earnVault.apyPercent,
      })
    : undefined
  const tokenSymbol = tokenQueryData?.symbol ?? aggregateBalance?.currencyInfo.currency.symbol ?? ''

  return {
    balanceUsd,
    earnPosition,
    earnVault,
    hasLoadedPositions,
    isLoggedIn,
    projectedAnnualEarningsUsd,
    tokenSymbol,
    userHasEarnPosition,
  }
}
