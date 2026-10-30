import { type SlippageDisplay, SlippageRow, SlippageRowLabel } from '@universe/swap-ui'
import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { SlippageInfo } from 'uniswap/src/features/transactions/swap/components/MaxSlippageRow/SlippageInfo/SlippageInfo'
import type { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge, isChained } from 'uniswap/src/features/transactions/swap/utils/routing'

interface MaxSlippageRowProps {
  acceptedDerivedSwapInfo: DerivedSwapInfo<CurrencyInfo, CurrencyInfo>
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
}

/** Adapter: maps the accepted trade onto the swap-ui SlippageRow and wraps its label in the info shell. */
export function MaxSlippageRow({
  acceptedDerivedSwapInfo,
  autoSlippageTolerance,
  customSlippageTolerance,
}: MaxSlippageRowProps): JSX.Element {
  const { formatPercent } = useLocalizationContext()

  const acceptedTrade = acceptedDerivedSwapInfo.trade.trade ?? acceptedDerivedSwapInfo.trade.indicativeTrade
  if (!acceptedTrade) {
    throw new Error('Invalid render of `MaxSlippageInfo` with no `trade`')
  }

  if (!acceptedTrade.indicative && isBridge(acceptedTrade)) {
    throw new Error('Invalid render of `MaxSlippageInfo` for bridge trade')
  }

  // If we don't have a custom slippage tolerance set, we won't have a tolerance to display for an indicative quote,
  // since only the full quote has a slippage tolerance. In this case, we display a loading state until the full quote is received.
  const showLoadingState = acceptedTrade.indicative && !acceptedTrade.slippageTolerance

  // Make text the warning color if user is setting custom slippage higher than auto slippage value
  const showSlippageWarning =
    acceptedTrade.slippageTolerance && autoSlippageTolerance
      ? acceptedTrade.slippageTolerance > autoSlippageTolerance
      : false

  const slippage: SlippageDisplay = {
    tolerance: formatPercent(acceptedTrade.slippageTolerance),
    isZero: acceptedTrade.slippageTolerance === 0,
    isCustom: !!customSlippageTolerance,
    exceedsAuto: showSlippageWarning,
  }

  return (
    <SlippageRow
      label={
        <SlippageInfo
          autoSlippageTolerance={autoSlippageTolerance}
          isCustomSlippage={!!customSlippageTolerance}
          trade={acceptedTrade}
        >
          <SlippageRowLabel isChained={!acceptedTrade.indicative && isChained(acceptedTrade)} />
        </SlippageInfo>
      }
      slippage={slippage}
      isLoading={showLoadingState}
    />
  )
}
