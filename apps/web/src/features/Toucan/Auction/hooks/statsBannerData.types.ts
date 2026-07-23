import { BidTokenInfo } from '~/features/Toucan/Auction/store/types'
import { CommittedVolumeBreakdown } from '~/features/Toucan/Auction/utils/computeCommittedVolumeBreakdown'

export interface StatsBannerData {
  // Current clearing price
  clearingPriceDecimal: number // Raw decimal value for SubscriptZeroPrice component
  clearingPriceFormatted: string // e.g., "1.25 ETH"
  clearingPriceFiatFormatted: string // e.g., "$2,750" (in user's selected fiat currency)
  clearingPriceFiatValue: number | null // Numeric fiat value for SubscriptZeroPrice (in user's currency)
  changePercent: number | null // null if no change (clearing === floor)
  isPositiveChange: boolean
  changeLabel: 'aboveFloor' | 'pastHour' // which label to show next to the change %
  bidTokenSymbol: string | null // e.g., "ETH"
  bidTokenInfo: BidTokenInfo | undefined // Full bid token info for formatting

  // Current valuation (totalSupply * clearingPrice)
  currentValuationFormatted: string // e.g., "224.5k ETH"
  currentValuationFiatFormatted: string // e.g., "$494.9M" (in user's selected fiat currency)

  // Bids concentration (from concentration band)
  concentrationStartDecimal: number | null // Raw decimal value for SubscriptZeroPrice
  concentrationEndDecimal: number | null // Raw decimal value for SubscriptZeroPrice
  concentrationFiatRangeFormatted: string | null // e.g., "$0.0463 – $0.0563" (fiat price range)
  concentrationStartFiatValue: number | null // Numeric fiat value for SubscriptZeroPrice (in user's currency)
  concentrationEndFiatValue: number | null // Numeric fiat value for SubscriptZeroPrice (in user's currency)

  // Total committed volume (totalBidVolume from auction details)
  totalBidVolumeFormatted: string | null // e.g., "12.4k ETH"
  totalBidVolumeFiatFormatted: string | null // e.g., "$27.3M" (in user's selected fiat currency)

  // Currency raised at clearing price (from checkpoint data) - for tooltip
  currencyRaisedFormatted: string | null // e.g., "12.4k ETH"

  // Required currency to graduate (requiredCurrencyRaised from auction details) - for tooltip
  requiredCurrencyFormatted: string | null // e.g., "10k ETH"

  committedVolumeBreakdown: CommittedVolumeBreakdown | null

  // True when the auction has low committed volume / few bids paired with a high FDV
  isLowVolumeHighFdv: boolean

  // Loading state
  isLoading: boolean
  hasData: boolean

  // Auction state
  isAuctionEnded: boolean
  isAuctionNotStarted: boolean
}
