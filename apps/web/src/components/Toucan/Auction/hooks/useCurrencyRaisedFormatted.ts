import { useMemo } from 'react'
import { BidTokenInfo } from '~/components/Toucan/Auction/store/types'
import { formatTokenAmountWithSymbol } from '~/components/Toucan/Auction/utils/fixedPointFdv'

/**
 * Hook that formats the currency raised at clearing price from checkpoint data.
 *
 * This is different from totalBidVolume - currencyRaised is the amount at clearing price.
 * Uses smart decimal formatting with fixed decimal places (trailing zeros preserved):
 * - Abbreviated (K/M/B/T): exactly 3 decimals (e.g., "1.234M ETH")
 * - Non-abbreviated stablecoins: exactly 2 decimals (e.g., "1234.00 USDC")
 * - Non-abbreviated other tokens: exactly 5 decimals (e.g., "123.40000 ETH")
 *
 * @param currencyRaisedRaw - Raw currency raised value from checkpoint data
 * @param bidTokenInfo - Bid token info for decimals, symbol, and stablecoin status
 * @returns Formatted string or null if data unavailable
 */
export function useCurrencyRaisedFormatted({
  currencyRaisedRaw,
  bidTokenInfo,
}: {
  currencyRaisedRaw: string | undefined
  bidTokenInfo: BidTokenInfo | undefined
}): string | null {
  return useMemo(() => {
    if (!currencyRaisedRaw || !bidTokenInfo) {
      return null
    }

    return formatTokenAmountWithSymbol({
      raw: BigInt(currencyRaisedRaw),
      decimals: bidTokenInfo.decimals,
      symbol: bidTokenInfo.symbol,
      isStablecoin: bidTokenInfo.isStablecoin,
    })
  }, [currencyRaisedRaw, bidTokenInfo])
}
