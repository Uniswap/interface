import { Flex, Text } from '@universe/mycelium'
import { getMarginHealthStatus } from '~/features/margin/utils/marginFormat'
import { useMarginHealthLabels } from '~/pages/Swap/Margin/hooks/useMarginHealthLabels'

// The health tier as a labeled chip — tinted background + tier color, matching the leverage-selector
// chip. Renders for whatever tier the health factor lands in; the caller decides whether to show it.
export function MarginHealthPill({ healthFactor }: { healthFactor: number }): JSX.Element {
  const status = getMarginHealthStatus(healthFactor)
  const labels = useMarginHealthLabels()
  return (
    <Flex px="$spacing6" py="$spacing2" borderRadius="$roundedFull" backgroundColor={status.backgroundColor}>
      <Text variant="buttonLabel4" color={status.color}>
        {labels[status.key]}
      </Text>
    </Flex>
  )
}
