import { Flex, useIsDarkMode } from 'ui/src'
import { PolygonPurple } from 'ui/src/components/logos'
import { colors, imageSizes, opacify } from 'ui/src/theme'

export const PolygonElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      borderRadius="$rounded12"
      opacity={isDarkMode ? 0.8 : 1}
      p="$spacing12"
      style={{ backgroundColor: opacify(isDarkMode ? 10 : 20, colors.violet300) }}
      transform={[{ rotateZ: '-20deg' }]}
    >
      <PolygonPurple size={imageSizes.image24} />
    </Flex>
  )
}
