import { AnimatePresence, Flex, useIsShortMobileDevice } from 'ui/src'
import { ExactOutputUnavailableWarningRow } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/ExactOutputUnavailableWarningRow'
import { GasAndWarningRows } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/GasAndWarningRows/GasAndWarningRows'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { isWebPlatform } from 'utilities/src/platform'

/**
 * IMPORTANT: If you modify the footer layout, you must test this on a small device and verify that the `DecimalPad`
 *            is able to properly calculate the correct height and it does not change its height when the gas and
 *            warning rows are shown/hidden, or when moving from the review screen back to the form screen.
 */
export function SwapFormScreenFooter(): JSX.Element | null {
  const isShortMobileDevice = useIsShortMobileDevice()
  const { outputTokenHasBuyTax, showFooter, showExactOutputUnavailableWarning, exactAmountToken, currencies } =
    useSwapFormScreenStore((state) => ({
      outputTokenHasBuyTax: state.outputTokenHasBuyTax,
      showFooter: state.showFooter,
      showExactOutputUnavailableWarning: state.showExactOutputUnavailableWarning,
      exactAmountToken: state.exactAmountToken,
      currencies: state.currencies,
    }))

  if (!showFooter) {
    return null
  }

  /**
   * *********** IMPORTANT! ***********
   *
   * We *always* want to render `GasAndWarningRows` on native mobile,
   * except when rendering an exact output unavailable warning.
   *
   * We do not want `GasAndWarningsRows` to be conditionally rendered
   * because it's used to calculate the available space for the `DecimalPad`,
   * and we don't want it to be resized when gas and warnings show up.
   *
   * *********** IMPORTANT! ***********
   */
  const showGasAndWarningRows = isWebPlatform
    ? exactAmountToken && !showExactOutputUnavailableWarning
    : !showExactOutputUnavailableWarning

  return (
    <Flex minHeight="$spacing40" pt={isShortMobileDevice ? '$spacing8' : '$spacing12'}>
      <AnimatePresence>
        {showExactOutputUnavailableWarning && (
          <ExactOutputUnavailableWarningRow currencies={currencies} outputTokenHasBuyTax={outputTokenHasBuyTax} />
        )}
      </AnimatePresence>
      {/* Accordion.Toggle is nested in GasAndWarningRows */}
      {showGasAndWarningRows && <GasAndWarningRows />}
    </Flex>
  )
}
