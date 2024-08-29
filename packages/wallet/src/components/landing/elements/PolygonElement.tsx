import { Flex, useIsDarkMode } from 'ui/src'
import { PolygonPurple } from 'ui/src/components/logos'
import { colors, imageSizes, opacify } from 'ui/src/theme'

export const PolygonElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={opacify(isDarkMode ? 10 : 20, colors.purplePastel)}
      borderRadius="$rounded12"
      opacity={isDarkMode ? 0.8 : 1}
      p="$spacing12"
      transform={[{ rotateZ: '-20deg' }]}
    >
      <PolygonPurple size={imageSizes.image24} />
    </Flex>
  )
}
