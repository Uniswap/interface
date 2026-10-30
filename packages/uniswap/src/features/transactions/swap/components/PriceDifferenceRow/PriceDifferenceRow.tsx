import { PriceDifferenceLabel, PriceDifferenceRow as PriceDifferenceRowView } from '@universe/swap-ui'
import { toSwapWarningDisplay } from 'uniswap/src/components/modals/WarningModal/utils'
import { MarketPriceDifferenceWarningModal } from 'uniswap/src/features/transactions/swap/components/PriceDifferenceRow/MarketPriceDifferenceWarning'
import { usePriceDifference } from 'uniswap/src/features/transactions/swap/components/PriceDifferenceRow/usePriceDifference'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings/useSwapWarnings'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

/** Adapter: derives the price difference and warning, then renders the swap-ui row with the label in its info shell. */
export function PriceDifferenceRow({
  hide,
  derivedSwapInfo,
}: {
  hide?: boolean
  derivedSwapInfo: DerivedSwapInfo
}): JSX.Element | null {
  const { formattedPriceDifference } = usePriceDifference({ derivedSwapInfo })
  const { priceImpactWarning } = useParsedSwapWarnings()

  const trade = derivedSwapInfo.trade.trade

  if (hide || !trade || !formattedPriceDifference || !priceImpactWarning) {
    return null
  }

  return (
    <PriceDifferenceRowView
      value={formattedPriceDifference}
      warning={toSwapWarningDisplay(priceImpactWarning)}
      label={
        <MarketPriceDifferenceWarningModal routing={trade.routing}>
          <PriceDifferenceLabel />
        </MarketPriceDifferenceWarningModal>
      }
    />
  )
}
