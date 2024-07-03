import { Flex } from 'ui/src'
import { Heart } from 'ui/src/components/icons'
import { colors, iconSizes, opacify } from 'ui/src/theme'

export const HeartElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$rounded12"
      p="$spacing12"
      style={{ backgroundColor: opacify(20, colors.red200) }}
      transform={[{ rotateZ: '-20deg' }]}
    >
      <Heart color={colors.red300} size={iconSizes.icon16} />
    </Flex>
  )
}
