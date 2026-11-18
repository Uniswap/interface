import { FormattedUniswapXGasFeeInfo, GasFeeResult, TradingApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'

export type GasInfo = {
  gasFee: GasFeeResult
  fiatPriceFormatted?: string
  uniswapXGasFeeInfo?: FormattedUniswapXGasFeeInfo
  isHighRelativeToValue: boolean
  isLoading: boolean
  chainId: UniverseChainId
  sponsorshipInfo?: TradingApi.SponsorshipInfo
}

/**
 * The web form's details expander. SwapFormScreenDetails.web owns the state: the gas toggle in
 * TradeInfoRow opens the ExpandableRows below the footer. Native has no inline expander and omits it.
 */
export type DetailsExpandedProps = {
  detailsExpanded?: boolean
  onDetailsExpandedChange?: (expanded: boolean) => void
}
