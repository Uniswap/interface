import { Flex, useIsDarkMode } from 'ui/src'
import { Heart } from 'ui/src/components/icons'
import { DEP_accentColors, iconSizes, opacify } from 'ui/src/theme'

export const HeartElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={opacify(20, isDarkMode ? DEP_accentColors.red400 : DEP_accentColors.red200)}
      borderRadius="$rounded12"
      opacity={0.8}
      p="$spacing12"
      transform={[{ rotateZ: '-20deg' }]}
    >
      <Heart color={DEP_accentColors.red300} opacity={0.95} size={iconSizes.icon16} />
    </Flex>
  )
}
