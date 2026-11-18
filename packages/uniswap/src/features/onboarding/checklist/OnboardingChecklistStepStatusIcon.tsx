import { Flex } from '@universe/mycelium'
import { Check } from '@universe/mycelium/icons/Check'

// 20px ring in a 24px box
const STATUS_RING_RATIO = 5 / 6

export function OnboardingChecklistStepStatusIcon({ isDone, size }: { isDone: boolean; size: number }): JSX.Element {
  const ringSize = size * STATUS_RING_RATIO

  return (
    <Flex centered width={size} height={size}>
      {isDone ? (
        <Flex centered width={ringSize} height={ringSize} borderRadius="$roundedFull" backgroundColor="$accent2">
          <Check size={ringSize / 2} color="$accent1" />
        </Flex>
      ) : (
        <Flex width={ringSize} height={ringSize} borderRadius="$roundedFull" borderWidth={2} borderColor="$neutral3" />
      )}
    </Flex>
  )
}
