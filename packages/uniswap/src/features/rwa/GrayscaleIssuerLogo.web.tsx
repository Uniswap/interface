import { Flex, UniversalImage } from '@universe/mycelium'
import type { GrayscaleIssuerLogoProps } from 'uniswap/src/features/rwa/GrayscaleIssuerLogo'

export function GrayscaleIssuerLogo({ uri, size }: GrayscaleIssuerLogoProps): JSX.Element {
  return (
    <Flex filter="grayscale(1)">
      <UniversalImage
        allowLocalUri
        size={{ height: size, width: size }}
        style={{ image: { borderRadius: size } }}
        uri={uri}
      />
    </Flex>
  )
}
