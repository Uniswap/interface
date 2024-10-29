import { Flex, useIsDarkMode } from 'ui/src'
import { PolygonPurple } from 'ui/src/components/logos/PolygonPurple'
import { imageSizes, networkColors, opacify } from 'ui/src/theme'

export const PolygonElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={isDarkMode ? opacify(10, networkColors.polygon.dark) : opacify(12, networkColors.polygon.light)}
      borderRadius="$rounded12"
      p="$spacing12"
      transform={[{ rotateZ: '-20deg' }]}
    >
      <PolygonPurple size={imageSizes.image24} />
    </Flex>
  )
}
