import { Flex } from 'ui/src'
import { Heart } from 'ui/src/components/icons'
import { DEP_accentColors, opacify, validColor } from 'ui/src/theme'

export const HeartElement = (): JSX.Element => {
  return (
    <Flex
      backgroundColor={opacify(10, DEP_accentColors.red400)}
      borderRadius="$rounded12"
      p="$spacing12"
      transform={[{ rotateZ: '-20deg' }]}
    >
      <Heart color={validColor(DEP_accentColors.red300)} opacity={0.95} size="$icon.16" />
    </Flex>
  )
}
