import { Flex } from 'ui/src/components/layout/Flex'
import { PlainImage } from 'ui/src/components/UniversalImage/internal/PlainImage'
import { SvgImageProps } from 'ui/src/components/UniversalImage/types'
import { useSvgData } from 'ui/src/components/UniversalImage/utils'

export function SvgImage({ uri, size, autoplay, fallback }: SvgImageProps): JSX.Element | null {
  const svgData = useSvgData(uri, autoplay)

  if (!svgData?.content || !svgData.aspectRatio) {
    return fallback ?? <Flex />
  }

  // Since this would violate HTTP CSP for images to use the direct data
  // from a fetch call, we use plain image for SVG's on web
  return <PlainImage fallback={fallback} size={size} uri={uri} />
}
