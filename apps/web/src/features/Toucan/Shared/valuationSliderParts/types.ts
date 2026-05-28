export enum ValuationInputType {
  TokenPrice = 'tokenPrice',
  Fdv = 'fdv',
}

export interface ClampParams {
  value: number
  min: number
  max: number
}

interface TickGroupingConfig {
  groupSizeTicks: number
}

export interface ValuationSliderProps {
  /** Current token price in Q96 format */
  valueQ96: bigint | undefined
  /** Called with new token price Q96 when slider changes */
  onChangeQ96: (q96: bigint) => void
  /** Decimals of the bid/quote token (e.g., 6 for USDC) */
  bidTokenDecimals?: number
  /** Symbol of the bid/quote token (e.g., "USDC") */
  bidTokenSymbol: string
  /** Accent color for the slider thumb and active track */
  tokenColor?: string
  /** Whether the slider is disabled */
  disabled?: boolean
  /** Called when user starts interacting with the slider */
  onInteractionStart?: () => void
  /** Clearing price in Q96 format */
  clearingPriceQ96?: bigint
  /** Floor price in Q96 format */
  floorPriceQ96?: bigint
  /** Tick size in Q96 format */
  tickSizeQ96?: bigint
  /** Decimals of the auction/base token (default 18) */
  auctionTokenDecimals?: number
  /** Total supply of the auction token (raw string) for FDV calculation */
  tokenTotalSupply?: string
  /** Fiat price of the bid token (USD) for tooltip display */
  bidTokenPriceFiat?: number
  /** Tick grouping configuration for grouped slider steps */
  tickGrouping?: TickGroupingConfig | null
  /** Whether tick grouping is enabled */
  groupTicksEnabled?: boolean
  /** Whether token color is still loading (hides slider until ready) */
  tokenColorLoading?: boolean
  // Controls what the input field represents; slider thumb displays the inverse.
  //  TokenPrice (default): input shows token price, slider shows FDV
  //  Fdv: input shows FDV, slider shows token price
  inputType?: ValuationInputType
}
