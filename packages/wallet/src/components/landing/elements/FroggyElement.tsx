import { Flex, Image } from 'ui/src'
import { FROGGY } from 'ui/src/assets'
import { imageSizes } from 'ui/src/theme'

export const FroggyElement = (): JSX.Element => {
  return (
    <Flex borderRadius="$rounded12" p="$spacing8" transform={[{ rotateZ: '-10deg' }]}>
      <Image height={imageSizes.image48} resizeMode="contain" source={FROGGY} width={imageSizes.image48} />
    </Flex>
  )
}
