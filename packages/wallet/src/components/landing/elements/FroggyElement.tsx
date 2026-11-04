import { Flex, imageSizes } from '@universe/mycelium'
import { FROGGY } from '@universe/mycelium/assets'
import { Image } from 'ui/src'

export const FroggyElement = (): JSX.Element => {
  return (
    <Flex borderRadius="$rounded12" p="$spacing8" transform={[{ rotateZ: '-10deg' }]}>
      <Image
        height={imageSizes.image48}
        $xs={{ height: imageSizes.image36, width: imageSizes.image36 }}
        resizeMode="contain"
        source={FROGGY}
        width={imageSizes.image48}
      />
    </Flex>
  )
}
