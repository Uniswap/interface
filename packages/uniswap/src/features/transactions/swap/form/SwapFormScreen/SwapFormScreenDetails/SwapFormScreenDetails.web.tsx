import { Accordion, Flex } from 'ui/src'
import { SwapFormButton } from 'uniswap/src/features/transactions/swap/components/SwapFormButton/SwapFormButton'
import { ExpandableRows } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/ExpandableRows'
import { SwapFormScreenFooter } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/SwapFormScreenFooter'
import { SwapFormWarningModals } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormWarningModals/SwapFormWarningModals'
import { useSwapFormScreenStore } from 'uniswap/src/features/transactions/swap/form/stores/swapFormScreenStore/useSwapFormScreenStore'
import { SwapFormWarningStoreContextProvider } from 'uniswap/src/features/transactions/swap/form/stores/swapFormWarningStore/SwapFormWarningStoreContextProvider'
import { usePriceUXEnabled } from 'uniswap/src/features/transactions/swap/hooks/usePriceUXEnabled'

export function SwapFormScreenDetails(): JSX.Element {
  const isPriceUXEnabled = usePriceUXEnabled()
  const { tokenColor, showFooter } = useSwapFormScreenStore((state) => ({
    tokenColor: state.tokenColor,
    showFooter: state.showFooter,
  }))

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
            <SwapFormWarningStoreContextProvider>
              <SwapFormButton tokenColor={tokenColor} />
              <SwapFormWarningModals />
            </SwapFormWarningStoreContextProvider>
          </Flex>
          <SwapFormScreenFooter />
        </Flex>
        {showFooter && !isPriceUXEnabled ? <ExpandableRows /> : null}
      </Accordion.Item>
    </Accordion>
  )
}
