import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import type { useCurrencyInfo } from 'uniswap/src/features/tokens/useCurrencyInfo'
import type { MinValuationErrorDetails } from '~/features/Toucan/Auction/utils/evaluateMaxPrice'

export interface MaxValuationFieldState {
  currencyAmount: CurrencyAmount<Currency> | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  usdValue: CurrencyAmount<Currency> | null
  value: string
  tokenValue: string
  tokenValueQ96: bigint | undefined
  snappedTokenValue: string
  bidTokenSymbol: string
  error?: string
  errorDetails?: MinValuationErrorDetails
  /** The last entry asked for more than the ceiling allows and was capped to it. */
  wasCappedToMax: boolean
  isFiatMode: boolean
  onChange: (amount: string) => void
  onTokenValueChange: (amount: string) => void
  onTokenValueQ96Change: (q96: bigint) => void
  onBlur: () => void
  onToggleFiatMode: () => void
  setSkipBlurSnap: (skip: boolean) => void
}

export interface UseBidMaxValuationFieldParams {
  bidCurrency: Currency | undefined
  currencyBalance: CurrencyAmount<Currency> | undefined
  currencyInfo: ReturnType<typeof useCurrencyInfo>
  bidTokenDecimals: number | undefined
  auctionTokenDecimals: number | undefined
  bidTokenSymbol: string
  clearingPriceQ96: bigint | undefined
  floorPriceQ96: bigint | undefined
  tickSizeQ96: bigint | undefined
  minMaxPriceQ96: bigint | undefined
  /** The auction's bid price ceiling, when a validation hook imposes one. */
  maxBidPriceQ96?: bigint
  /** The minimum valid bid, formatted for the below-minimum error copy. */
  minValidPriceDisplay: string | undefined
  minValidPriceDisplayFormatted: string | undefined
  defaultMaxValuationDisplay: string
  onInputChange?: () => void
}
