import { Accordion, Flex } from 'ui/src'
import { ExpandableRows } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/ExpandableRows'
import { SwapFormScreenFooter } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenFooter'
import { SwapFormWarningModals } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormWarningModals/SwapFormWarningModals'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/form/body/SwapFormButton/SwapFormButton'
import { useSwapFormScreenState } from 'uniswap/src/features/transactions/swap/form/context/SwapFormScreenContext'
import { SwapFormWarningStateProvider } from 'uniswap/src/features/transactions/swap/form/context/SwapFormWarningStateContextProvider'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'

export function SwapFormScreenDetails(): JSX.Element {
  const isPriceUXEnabled = usePriceUXEnabled()
  const { tokenColor, isBridge, showFooter } = useSwapFormScreenState()

  return (
    <Accordion collapsible type="single" overflow="hidden">
      <Accordion.Item value="a1" className="gas-container">
        {/* <Accordion.HeightAnimator> attaches an absolutely positioned element that cannot be targeted without the below style */}
        <style>{`
              .gas-container > div > div {
                width: 100%;
              }
            `}</style>
        <Flex>
          <Flex>
            <SwapFormWarningStateProvider>
              <SwapFormButton tokenColor={tokenColor} />
              <SwapFormWarningModals />
            </SwapFormWarningStateProvider>
          </Flex>
          <SwapFormScreenFooter />
        </Flex>
        {showFooter && !isPriceUXEnabled ? <ExpandableRows isBridge={isBridge} /> : null}
      </Accordion.Item>
    </Accordion>
  )
}
