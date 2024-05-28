import { Flex } from 'ui/src'
import { PolygonPurple } from 'ui/src/components/logos'
import { colors, imageSizes, opacify } from 'ui/src/theme'

export const PolygonElement = (): JSX.Element => {
  return (
    <Flex
      borderRadius="$rounded12"
      p="$spacing12"
      style={{ backgroundColor: opacify(20, colors.violet300) }}
      transform={[{ rotateZ: '-20deg' }]}>
      <PolygonPurple size={imageSizes.image24} />
    </Flex>
  )
}
