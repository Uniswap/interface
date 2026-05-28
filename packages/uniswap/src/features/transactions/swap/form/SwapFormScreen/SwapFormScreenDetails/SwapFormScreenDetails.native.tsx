import { Accordion } from 'ui/src'
import { SwapFormScreenFooter } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/SwapFormScreenFooter'

export function SwapFormScreenDetails(): JSX.Element {
  return (
    <Accordion collapsible type="single" overflow="hidden">
      <Accordion.Item value="a1">
        <SwapFormScreenFooter />
      </Accordion.Item>
    </Accordion>
  )
}
