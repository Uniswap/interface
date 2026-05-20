import { mix } from 'polished'
import { useMemo } from 'react'
import { useSporeColors } from 'ui/src'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useSrcColor } from '~/hooks/useColor'
import type { TokenAccentHex } from '~/pages/Liquidity/CreateAuction/tokenAccentHex'
import { type RaiseCurrency } from '~/pages/Liquidity/CreateAuction/types'
import { getRaiseCurrencyAsCurrency } from '~/pages/Liquidity/CreateAuction/utils'

/** Colors for the auction token distribution bar (fundraise + LP legs). */
export function useCreateAuctionDistributionBarColors({
  chainId,
  raiseCurrency,
  tokenColor,
}: {
  chainId: UniverseChainId
  raiseCurrency: RaiseCurrency
  tokenColor?: TokenAccentHex
}): { fundraiseColor: string; raiseSideLpColor: string; tokenSideLpColor: string } {
  const colors = useSporeColors()
  const raiseCurrencySdk = useMemo(() => getRaiseCurrencyAsCurrency(raiseCurrency, chainId), [raiseCurrency, chainId])
  const raiseCurrencyToken = useCurrencyInfo(raiseCurrencySdk ? currencyId(raiseCurrencySdk) : undefined)
  const raiseSideLpColor =
    useSrcColor({
      src: raiseCurrencyToken?.logoUrl ?? undefined,
      currencyName: raiseCurrencyToken?.currency.name ?? undefined,
      backgroundColor: colors.surface1.val,
      defaultColor: '#2775CA',
    }).tokenColor ?? '#2775CA'

  const fundraiseColor = tokenColor ?? colors.accent1.val
  const tokenSideLpColor = useMemo(() => mix(0.64, '#000000', fundraiseColor), [fundraiseColor])

  return { fundraiseColor, raiseSideLpColor, tokenSideLpColor }
}
