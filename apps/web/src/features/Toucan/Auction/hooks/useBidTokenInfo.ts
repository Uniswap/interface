import { UniverseChainId } from '@universe/chains'
import { useMemo, useRef } from 'react'
import { isStablecoinAddress } from 'uniswap/src/features/chains/utils'
import { useCurrencyInfoWithLoading } from 'uniswap/src/features/tokens/useCurrencyInfo'
import { useUSDCPrice } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { buildCurrencyId } from 'uniswap/src/utils/currencyId'
import { useEvent } from 'utilities/src/react/hooks'
import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'

/** Marks "resolution finished with no currency"; callers render their own copy, never this message. */
const BID_TOKEN_UNRESOLVED_MESSAGE = 'Bid token could not be resolved'

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
 * @returns BidTokenInfo with loading and error states, plus a refetch that re-runs the token lookup
 */
export function useBidTokenInfo({ bidTokenAddress, chainId, skip }: UseBidTokenInfoOptions): {
  bidTokenInfo: BidTokenInfo | undefined
  /** Also true when metadata is unavailable after a failed lookup; consumers with an error UI must check error first. */
  loading: boolean
  error?: Error
  refetch: () => void
} {
  const currencyId = useMemo(
    () => (chainId && bidTokenAddress ? buildCurrencyId(chainId, bidTokenAddress) : undefined),
    [chainId, bidTokenAddress],
  )

  const {
    data: currencyInfo,
    isLoading: currencyLoading,
    error: currencyError,
    refetch: refetchCurrencyInfo,
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
  // Settled with no currency (unknown or unbuildable token) is a bid currency failure, not an in-flight state.
  // Memoized per hook instance so consumers can key effects on the error without sharing one module-level object.
  const isUnresolved = Boolean(currencyId && !skip && !currencyLoading && !currencyInfo)
  const unresolvedError = useMemo(
    () => (isUnresolved ? new Error(BID_TOKEN_UNRESOLVED_MESSAGE) : undefined),
    [isUnresolved],
  )
  const error = currencyError ?? unresolvedError

  // react-query's refetch ignores `enabled`, so a skipped lookup has to stay idle here.
  const refetch = useEvent(() => {
    if (!skip) {
      void refetchCurrencyInfo()
    }
  })

  return { bidTokenInfo, loading, error, refetch }
}
