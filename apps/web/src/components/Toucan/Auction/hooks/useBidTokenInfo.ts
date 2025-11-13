import { BidTokenInfo } from 'components/Toucan/Auction/store/types'
import { useMemo } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'

/**
 * Hook to fetch bid token information from on-chain/API data
 * Derives decimals, symbol, and priceFiat (in USD) from bidTokenAddress and chainId
 * Note: Multi-currency conversion is handled at the display layer
 *
 * @param bidTokenAddress - The address of the bid token (or undefined for native token)
 * @param chainId - The chain ID where the token exists
 * @returns BidTokenInfo with loading and error states
 */
export function useBidTokenInfo(
  bidTokenAddress?: string,
  chainId?: UniverseChainId,
): { bidTokenInfo: BidTokenInfo | undefined; loading: boolean; error?: Error } {
  const currencyId = useMemo(
    () => (chainId && bidTokenAddress ? buildCurrencyId(chainId, bidTokenAddress) : undefined),
    [chainId, bidTokenAddress],
  )
  const { currencyInfo, loading: currencyLoading, error: currencyError } = useCurrencyInfoWithLoading(currencyId)
  const currency = currencyInfo?.currency
  const { price, isLoading: isPriceLoading } = useUSDCPrice(currency)

  const bidTokenInfo = useMemo((): BidTokenInfo | undefined => {
    if (!currency || !price) {
      return undefined
    }

    // Established pattern: parseFloat(price.toSignificant())
    // Used in packages/uniswap/src/features/transactions/swap/utils/trade.ts:150
    // NOTE | Toucan: Price is fetched in USD/stablecoin from on-chain data.
    // Multi-currency support is handled at display layer via useFiatConverter.
    // This ensures accurate blockchain prices with localized display formatting.
    const priceFiat = parseFloat(price.toSignificant(6))
    if (isNaN(priceFiat)) {
      return undefined
    }

    return {
      symbol: currency.symbol ?? 'UNKNOWN', // TODO | Toucan - handle undefined case
      decimals: currency.decimals,
      priceFiat,
    }
  }, [currency, price])

  const priceParseError = useMemo(() => {
    if (!currency || !price) {
      return undefined
    }
    const priceFiat = parseFloat(price.toSignificant(6))
    return isNaN(priceFiat) ? new Error('Invalid token price: failed to parse price as a number') : undefined
  }, [currency, price])

  const loading = currencyLoading || !currencyInfo || isPriceLoading
  const error = currencyError || priceParseError

  return { bidTokenInfo, loading, error }
}
