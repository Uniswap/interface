import { Flex, useIsDarkMode } from 'ui/src'
import { Heart } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const HeartElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      borderRadius="$rounded12"
      opacity={0.8}
      p="$spacing12"
      style={{ backgroundColor: opacify(20, isDarkMode ? colors.red400 : colors.red200) }}
      transform={[{ rotateZ: '-20deg' }]}
    >
      <Heart color={colors.red300} opacity={0.95} size={iconSizes.icon16} />
    </Flex>
  )
}
