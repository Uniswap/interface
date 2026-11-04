import { Flex, imageSizes, validColor } from '@universe/mycelium'
import { OPENSEA_LOGO } from '@universe/mycelium/assets'
import { DEP_accentColors } from '@universe/mycelium/theme-palette'
import { Image } from 'ui/src'

export const OpenseaElement = (): JSX.Element => {
  return (
    <Flex backgroundColor={validColor(DEP_accentColors.blue400)} borderRadius="$roundedFull" p="$spacing4">
      <Image
        height={imageSizes.image32}
        $xs={{ height: imageSizes.image24, width: imageSizes.image24 }}
        resizeMode="contain"
        source={OPENSEA_LOGO}
        width={imageSizes.image32}
      />
    </Flex>
  )
}
