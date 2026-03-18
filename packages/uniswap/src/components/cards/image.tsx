import { Image } from 'ui/src'
import { isExtensionApp, isWebApp } from 'utilities/src/platform'

// This assumes a singular graphic size for cards.
// Please make sure design is aware of this and that the graphic works in small and large cards!
export const CardImageGraphicSizeInfo = {
  containerWidth: 32,
  ratio: isWebApp ? 0.16 : isExtensionApp ? 0.18 : 0.25,
  topOffsetRatio: isWebApp ? 0.51 : 0.24,
  width: 202,
  height: 624,
}

// biome-ignore lint/suspicious/noExplicitAny: legacy code requires any for compatibility
export function CardImage({ uri }: { uri: any }): JSX.Element | null {
  return (
    <Image
      alignSelf="center"
      position="absolute"
      resizeMode="cover"
      source={{
        width: CardImageGraphicSizeInfo.width * CardImageGraphicSizeInfo.ratio,
        height: CardImageGraphicSizeInfo.height * CardImageGraphicSizeInfo.ratio,
        uri,
      }}
      left={0}
      top={
        -(CardImageGraphicSizeInfo.height * CardImageGraphicSizeInfo.ratio * CardImageGraphicSizeInfo.topOffsetRatio)
      }
    />
  )
}
