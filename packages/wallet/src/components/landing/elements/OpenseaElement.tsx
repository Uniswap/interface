import { Flex, Image } from 'ui/src'
import { OPENSEA_LOGO } from 'ui/src/assets'
import { imageSizes } from 'ui/src/theme'

export const OpenseaElement = (): JSX.Element => {
  return (
    <Flex backgroundColor="$blue400" borderRadius="$roundedFull" p="$spacing4">
      <Image height={imageSizes.image32} resizeMode="contain" source={OPENSEA_LOGO} width={imageSizes.image32} />
    </Flex>
  )
}
