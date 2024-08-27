import { Flex, useIsDarkMode } from 'ui/src'
import { OnboardingUnicon } from 'ui/src/components/icons'
import { DEP_accentColors, iconSizes, opacify } from 'ui/src/theme'

export const UniconElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={opacify(isDarkMode ? 10 : 20, DEP_accentColors.violet200)}
      borderRadius="$roundedFull"
      opacity={isDarkMode ? 0.8 : 1}
      p="$spacing8"
      transform={[{ rotateZ: '-4deg' }]}
    >
      <OnboardingUnicon color={DEP_accentColors.violet400} size={iconSizes.icon28} />
    </Flex>
  )
}
