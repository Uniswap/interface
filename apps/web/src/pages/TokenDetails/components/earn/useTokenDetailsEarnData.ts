import { useMemo } from 'react'
import {
  type TokenDetailsEarnData,
  useTokenDetailsEarnData as useSharedTokenDetailsEarnData,
} from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { currencyId } from 'uniswap/src/utils/currencyId'
import type { TokenQueryData } from '~/appGraphql/data/Token'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { getAggregateTokenBalance } from '~/pages/TokenDetails/components/earn/utils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export type { TokenDetailsEarnData }

export function useTokenDetailsEarnData({
  enabled,
  tokenQueryData,
}: {
  enabled: boolean
  tokenQueryData: TokenQueryData | undefined
}): TokenDetailsEarnData {
  const evmAccountAddress = useActiveAddress(Platform.EVM)

  const { currency, multiChainMap } = useTDPStore((s) => ({
    currency: s.currency,
    multiChainMap: s.multiChainMap,
  }))

  const aggregateBalance = useMemo(() => getAggregateTokenBalance(multiChainMap), [multiChainMap])

  return useSharedTokenDetailsEarnData({
    enabled,
    account: evmAccountAddress,
    activeCurrencyId: currency ? currencyId(currency) : undefined,
    aggregateBalance,
    tokenProjectTokens: tokenQueryData?.project?.tokens,
    tokenPriceUsd: tokenQueryData?.market?.price?.value,
    tokenSymbolFallback: tokenQueryData?.symbol,
  })
}
