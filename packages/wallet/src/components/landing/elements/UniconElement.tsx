import { Flex } from 'ui/src'
import { OnboardingUnicon } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const UniconElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$roundedFull"
      p="$spacing8"
      style={{ backgroundColor: opacify(20, colors.violet400) }}
      transform={[{ rotateZ: '-4deg' }]}
    >
      <OnboardingUnicon color={colors.violet400} size={iconSizes.icon28} />
    </Flex>
  )
}
