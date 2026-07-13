import { Accordion, Flex } from 'ui/src'
import { GeoRestrictionCard } from 'uniswap/src/features/transactions/swap/components/GeoRestrictionCard/GeoRestrictionCard'
import { SwapOffHoursBanner } from 'uniswap/src/features/transactions/swap/components/SwapOffHoursBanner/SwapOffHoursBanner'
import { SwapFormScreenFooter } from 'uniswap/src/features/transactions/swap/form/SwapFormScreen/SwapFormScreenDetails/SwapFormScreenFooter/SwapFormScreenFooter'

export function SwapFormScreenDetails(): JSX.Element {
  return (
    <Flex gap="$spacing8">
      {/*
        Render the off-hours and geo-restriction cards directly below the currency panels (the "swap box")
        rather than after the footer. The footer reserves empty-row space when no warnings are present, which
        would otherwise push the cards down into the area covered by the absolutely-positioned decimal pad overlay.
      */}
      <SwapOffHoursBanner />
      <GeoRestrictionCard />
      <Accordion collapsible type="single" overflow="hidden">
        <Accordion.Item value="a1">
          <SwapFormScreenFooter />
        </Accordion.Item>
      </Accordion>
    </Flex>
  )
}
