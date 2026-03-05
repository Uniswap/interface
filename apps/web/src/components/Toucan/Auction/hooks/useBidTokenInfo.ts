import { useMemo, useRef } from 'react'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { BidTokenInfo } from '~/components/Toucan/Auction/store/types'

interface UseBidTokenInfoOptions {
  bidTokenAddress?: string
  chainId?: UniverseChainId
  skip?: boolean
}

/**
 * Hook to fetch bid token information from on-chain/API data
 * Derives decimals, symbol, and priceFiat (in USD) from bidTokenAddress and chainId
 * Note: Multi-currency conversion is handled at the display layer
 *
 * Uses useUSDCPrice (Trading API) for real-time pricing from swap quotes.
 *
 * Returns token info even when price is unavailable (e.g., testnets without price feeds).
 * Consumers should handle undefined priceFiat gracefully.
 *
 * @param bidTokenAddress - The address of the bid token (or undefined for native token)
 * @param chainId - The chain ID where the token exists
 * @param skip - If true, skips fetching token data (returns undefined with loading: false)
 * @returns BidTokenInfo with loading and error states
 */
export function useBidTokenInfo({ bidTokenAddress, chainId, skip }: UseBidTokenInfoOptions): {
  bidTokenInfo: BidTokenInfo | undefined
  loading: boolean
  error?: Error
} {
  const currencyId = useMemo(
    () => (chainId && bidTokenAddress ? buildCurrencyId(chainId, bidTokenAddress) : undefined),
    [chainId, bidTokenAddress],
  )

  const {
    currencyInfo,
    loading: currencyLoading,
    error: currencyError,
  } = useCurrencyInfoWithLoading(currencyId, {
    skip,
  })
  const currency = currencyInfo?.currency

  // Fetch price via Trading API (useUSDCPrice)
  const { price: usdcPrice } = useUSDCPrice(currency)

  // Extract USD price from Price object (may be undefined for testnets without liquidity)
  const priceFiat = useMemo(() => {
    if (!usdcPrice) {
      return undefined
    }
    try {
      return Number(usdcPrice.toSignificant(18))
    } catch {
      return undefined
    }
  }, [usdcPrice])

  // Check if the bid token is a stablecoin
  const isStablecoin = useMemo(() => {
    if (!chainId || !bidTokenAddress) {
      return false
    }
    return isStablecoinAddress(chainId, bidTokenAddress)
  }, [chainId, bidTokenAddress])

  // Track previous bidTokenInfo to avoid creating new references when values are identical
  const prevBidTokenInfoRef = useRef<BidTokenInfo | undefined>(undefined)

  // Return token info even when price is unavailable - use 0 as fallback
  // This follows the same pattern as TopAuctionsTable which shows bid token amounts when USD is unavailable
  // Consumers can check for priceFiat === 0 to show "--" for fiat values
  const bidTokenInfo = useMemo((): BidTokenInfo | undefined => {
    if (!currency) {
      prevBidTokenInfoRef.current = undefined
      return undefined
    }

    const symbol = currency.symbol ?? 'UNKNOWN'
    const decimals = currency.decimals
    const price = priceFiat ?? 0 // 0 when price unavailable (e.g., testnets without price feeds)

    // If values haven't changed, return the same reference to prevent downstream re-renders
    const prev = prevBidTokenInfoRef.current
    if (
      prev &&
      prev.symbol === symbol &&
      prev.decimals === decimals &&
      prev.priceFiat === price &&
      prev.isStablecoin === isStablecoin
    ) {
      return prev
    }

    const newInfo: BidTokenInfo = {
      symbol,
      decimals,
      priceFiat: price,
      isStablecoin,
      logoUrl: currencyInfo.logoUrl,
    }

    prevBidTokenInfoRef.current = newInfo
    return newInfo
  }, [currency, priceFiat, isStablecoin, currencyInfo?.logoUrl])

  // Don't wait for price to load - return token info as soon as currency is available
  // Price will update reactively when it becomes available
  const loading = skip ? false : currencyLoading || !currencyInfo
  const error = currencyError

  return { bidTokenInfo, loading, error }
}
