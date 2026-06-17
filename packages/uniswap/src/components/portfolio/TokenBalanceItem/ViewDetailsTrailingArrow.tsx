import { Flex } from 'ui/src'
import { ArrowRight } from 'ui/src/components/icons/ArrowRight'

export function ViewDetailsTrailingArrow(): JSX.Element {
  return (
    <Flex
      opacity={0}
      x={-8}
      transition="opacity 200ms ease, transform 200ms ease"
      $group-hover={{
        opacity: 1,
        transform: 'translateX(0px)',
      }}
    >
      <ArrowRight size="$icon.8" color="$neutral2" />
    </Flex>
  )
}
