import { Flex, spacing } from '@universe/mycelium'

const TRACK_WIDTH = spacing.spacing48

export function OnboardingChecklistProgressBar({ completedFraction }: { completedFraction: number }): JSX.Element {
  return (
    <Flex
      width={TRACK_WIDTH}
      height="$spacing6"
      borderRadius="$roundedFull"
      backgroundColor="$surface3"
      overflow="hidden"
    >
      <Flex
        width={completedFraction * TRACK_WIDTH}
        height="100%"
        borderRadius="$roundedFull"
        backgroundColor="$accent1"
      />
    </Flex>
  )
}
