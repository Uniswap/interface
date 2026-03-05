import { formatTickForDisplay } from 'components/Toucan/Auction/BidDistributionChart/utils/utils'
import { BidTokenInfo, DisplayMode } from 'components/Toucan/Auction/store/types'

/**
 * Parameters for formatting a clearing price label
 */
interface FormatClearingPriceLabelParams {
  clearingPrice: number // Clearing price in decimal form
  displayMode: DisplayMode // Current display mode (token price vs valuation)
  bidTokenInfo: BidTokenInfo // Token information for formatting
  totalSupply?: string // Total supply for valuation calculations
  auctionTokenDecimals: number // Decimals for the auction token
  formatter: (amount: number) => string // Number formatter function
}

/**
 * Formats a clearing price value for display on the chart label.
 *
 * This pure function creates a formatted label string that's consistent with
 * the chart's tick labels and display mode. It's decoupled from the tooltip
 * formatting logic, making it independently testable and reusable.
 *
 * @param params - Formatting parameters
 * @returns Formatted clearing price string
 *
 * @example
 * ```typescript
 * // Token price mode
 * formatClearingPriceLabel({
 *   clearingPrice: 1.5,
 *   displayMode: DisplayMode.TOKEN_PRICE,
 *   bidTokenInfo: { decimals: 6, ... },
 *   formatter: (n) => `$${n.toFixed(2)}`
 * })
 * // Returns: "$1.50"
 *
 * // Valuation mode with FDV suffix
 * formatClearingPriceLabel({
 *   clearingPrice: 1500000,
 *   displayMode: DisplayMode.VALUATION,
 *   totalSupply: "1000000",
 *   ...
 * })
 * // Returns: "$1.5M FDV"
 * ```
 */
export function formatClearingPriceLabel(params: FormatClearingPriceLabelParams): string {
  const { clearingPrice, displayMode, bidTokenInfo, totalSupply, auctionTokenDecimals, formatter } = params

  // Use the same formatter as chart tick labels for consistency
  const formattedValue = formatTickForDisplay({
    tickValue: clearingPrice,
    displayMode,
    bidTokenInfo,
    totalSupply,
    auctionTokenDecimals,
    formatter,
  })

  return formattedValue
}
