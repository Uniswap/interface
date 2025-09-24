import { ResetActionButton } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityRangeActionButtons/ResetActionButton/ResetActionButton'
import { TimePeriodOptionButtons } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityRangeActionButtons/TimePeriodOptionButtons/TimePeriodOptionButtons'
import { ZoomButtons } from 'components/Charts/D3LiquidityRangeInput/D3LiquidityRangeChart/components/LiquidityRangeActionButtons/ZoomButtons/ZoomButtons'
import { Flex } from 'ui/src'

export function LiquidityRangeActionButtons() {
  return (
    <Flex
      row
      padding="$spacing16"
      justifyContent="space-between"
      gap="$spacing12"
      $sm={{
        row: false,
      }}
    >
      <Flex>
        <TimePeriodOptionButtons />
      </Flex>
      <Flex grow row justifyContent="space-between">
        <ZoomButtons />
        <ResetActionButton />
      </Flex>
    </Flex>
  )
}
