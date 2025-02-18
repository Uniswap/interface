import { useAccount } from 'hooks/useAccount'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { useMemo } from 'react'
import { getChainInfo } from 'uniswap/src/features/chains/chainInfo'
import { useSupportedChainId } from 'uniswap/src/features/chains/hooks/useSupportedChainId'

/**
 *
 * @param fiatValue string representation of a USD amount
 * @returns CurrencyAmount where currency is stablecoin on active chain
 */
export function useStablecoinAmountFromFiatValue(fiatValue: number | null | undefined) {
  const { chainId } = useAccount()
  const supportedChainId = useSupportedChainId(chainId)
  const stablecoin = supportedChainId ? getChainInfo(supportedChainId).spotPriceStablecoinAmount.currency : undefined

  return useMemo(() => {
    if (fiatValue === null || fiatValue === undefined || !chainId || !stablecoin) {
      return undefined
    }

    // trim for decimal precision when parsing
    const parsedForDecimals = fiatValue.toFixed(stablecoin.decimals).toString()
    try {
      // parse USD string into CurrencyAmount based on stablecoin decimals
      return tryParseCurrencyAmount(parsedForDecimals, stablecoin)
    } catch (error) {
      return undefined
    }
  }, [chainId, fiatValue, stablecoin])
}
