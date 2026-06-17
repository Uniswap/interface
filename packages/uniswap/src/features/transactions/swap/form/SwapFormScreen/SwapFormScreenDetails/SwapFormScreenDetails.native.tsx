import { Accordion, Flex } from 'ui/src'
import { GeoRestrictionCard } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionCard'
import { SwapFormScreenFooter } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/SwapFormScreenFooter'

export function SwapFormScreenDetails(): JSX.Element {
  return (
    <Flex gap="$spacing8">
      <Accordion collapsible type="single" overflow="hidden">
        <Accordion.Item value="a1">
          <SwapFormScreenFooter />
        </Accordion.Item>
      </Accordion>
      <GeoRestrictionCard />
    </Flex>
  )
}
