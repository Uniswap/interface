import { Flex, useIsDarkMode } from 'ui/src'
import { OnboardingUnicon } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const UniconElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      borderRadius="$roundedFull"
      opacity={isDarkMode ? 0.8 : 1}
      p="$spacing8"
      style={{ backgroundColor: opacify(isDarkMode ? 10 : 20, colors.violet200) }}
      transform={[{ rotateZ: '-4deg' }]}
    >
      <OnboardingUnicon color={colors.violet400} size={iconSizes.icon28} />
    </Flex>
  )
}
