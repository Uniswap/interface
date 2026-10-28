import { Flex, useIsDarkMode } from '@universe/mycelium'
import { ENS_LOGO } from '@universe/mycelium/assets'
import { Image } from 'ui/src'
import { imageSizes, opacify } from 'ui/src/theme'

// As we're using this color only in this component, we define it here instead in colors.ts
const BLUE_ENS_COLOR = '#33CAFF'

export const ENSElement = (): JSX.Element => {
  const isDarkMode = useIsDarkMode()

  return (
    <Flex
      backgroundColor={opacify(isDarkMode ? 10 : 20, BLUE_ENS_COLOR)}
      borderRadius="$rounded12"
      p="$spacing12"
      $xs={{ p: '$spacing8' }}
      transform={[{ rotateZ: '20deg' }]}
    >
      <Image
        height={imageSizes.image24}
        resizeMode="contain"
        source={ENS_LOGO}
        width={imageSizes.image24}
        $xs={{ height: imageSizes.image20, width: imageSizes.image20 }}
      />
    </Flex>
  )
}
