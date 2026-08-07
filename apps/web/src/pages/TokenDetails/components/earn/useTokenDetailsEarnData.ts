import { useMemo } from 'react'
import {
  type TokenDetailsEarnData,
  useTokenDetailsEarnData as useSharedTokenDetailsEarnData,
} from 'uniswap/src/features/earn/hooks/useTokenDetailsEarnData'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useActiveAddress } from '~/features/accounts/store/hooks'
import { useTDPMultichainTokensForEarn } from '~/pages/TokenDetails/components/earn/useTDPMultichainTokensForEarn'
import { getAggregateTokenBalance } from '~/pages/TokenDetails/components/earn/utils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export type { TokenDetailsEarnData }

export function useTokenDetailsEarnData({ enabled }: { enabled: boolean }): TokenDetailsEarnData {
  const evmAccountAddress = useActiveAddress(Platform.EVM)

  const { currency, multiChainMap, token } = useTDPStore((s) => ({
    currency: s.currency,
    multiChainMap: s.multiChainMap,
    token: s.token,
  }))

  const aggregateBalance = useMemo(() => getAggregateTokenBalance(multiChainMap), [multiChainMap])
  const multichainTokensForEarn = useTDPMultichainTokensForEarn()

  return useSharedTokenDetailsEarnData({
    enabled,
    account: evmAccountAddress,
    activeCurrencyId: currency ? currencyId(currency) : undefined,
    aggregateBalance,
    tokenProjectTokens: multichainTokensForEarn,
    tokenPriceUsd: token?.price?.spotUsd,
    tokenSymbolFallback: token?.symbol,
  })
}
