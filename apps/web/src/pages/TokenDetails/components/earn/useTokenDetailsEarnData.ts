import { useMemo } from 'react'
import { useEarnVaults } from 'uniswap/src/features/earn/hooks/useEarnVaults'
import type { EarnPositionInfo, EarnVaultInfo } from 'uniswap/src/features/earn/types'
import {
  getProjectedAnnualEarningsUsd,
  getTokenBalanceUsd,
  getTokenProjectCurrencyIds,
  hasEarnPosition,
  selectEarnVaultForToken,
} from 'uniswap/src/features/earn/utils'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { useActiveAddress } from '~/features/accounts/store/hooks'
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
  const evmAccountAddress = useActiveAddress(Platform.EVM)

  const { multiChainMap } = useTDPStore((s) => ({
    multiChainMap: s.multiChainMap,
  }))

  const tokenCurrencyIds = useMemo(
    () => getTokenProjectCurrencyIds(tokenQueryData?.project?.tokens),
    [tokenQueryData?.project?.tokens],
  )
  const aggregateBalance = useMemo(() => getAggregateTokenBalance(multiChainMap), [multiChainMap])
  const {
    hasLoadedPositions,
    positionsByVaultId,
    vaults: earnVaults,
  } = useEarnVaults({
    account: evmAccountAddress,
    enabled: enabled && tokenCurrencyIds.length > 0,
  })
  const earnVault = useMemo(
    () => selectEarnVaultForToken({ tokenCurrencyIds, vaults: earnVaults }),
    [earnVaults, tokenCurrencyIds],
  )
  const earnPosition = earnVault ? positionsByVaultId.get(earnVault.id) : undefined
  const isLoggedIn = !!evmAccountAddress
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
