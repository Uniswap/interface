import { Flex, imageSizes } from '@universe/mycelium'
import { PolygonPurple } from '@universe/mycelium/logos/PolygonPurple'
import { opacify, useIsDarkMode } from '@universe/mycelium/theme-hooks-compat'
import { networkColors } from '@universe/mycelium/theme-palette'
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
