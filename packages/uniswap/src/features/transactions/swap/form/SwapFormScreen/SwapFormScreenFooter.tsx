import { AnimatePresence, Flex, isWeb, useIsShortMobileDevice } from 'ui/src'
import { FoTWarningRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/FoTWarningRow'
import { useSwapFormScreenState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { GasAndWarningRows } from 'uniswap/src/features/transactions/swap/form/footer/GasAndWarningRows/GasAndWarningRows'

/**
 * IMPORTANT: If you modify the footer layout, you must test this on a small device and verify that the `DecimalPad`
 *            is able to properly calculate the correct height and it does not change its height when the gas and
 *            warning rows are shown/hidden, or when moving from the review screen back to the form screen.
 */
export function SwapFormScreenFooter(): JSX.Element | null {
  const isShortMobileDevice = useIsShortMobileDevice()
  const { outputTokenHasBuyTax, showFooter, showWarning, exactAmountToken, currencies } = useSwapFormScreenState()

  if (!showFooter) {
    return null
  }

  /**
   * *********** IMPORTANT! ***********
   *
   * We *always* want to render `GasAndWarningRows` on native mobile,
   * except when rendering a FoT warning.
   *
   * We do not want `GasAndWarningsRows` to be conditionally rendered
   * because it's used to calculate the available space for the `DecimalPad`,
   * and we don't want it to be resized when gas and warnings show up.
   *
   * *********** IMPORTANT! ***********
   */
  const showGasAndWarningRows = isWeb ? exactAmountToken && !showWarning : !showWarning

  return (
    <Flex minHeight="$spacing40" pt={isShortMobileDevice ? '$spacing8' : '$spacing12'}>
      <AnimatePresence>
        {showWarning && <FoTWarningRow currencies={currencies} outputTokenHasBuyTax={outputTokenHasBuyTax} />}
      </AnimatePresence>
      {/* Accordion.Toggle is nested in GasAndWarningRows */}
      {showGasAndWarningRows && <GasAndWarningRows />}
    </Flex>
  )
}
