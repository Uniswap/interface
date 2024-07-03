import { SvgXml } from 'react-native-svg'
import { SvgImageProps } from 'ui/src/components/UniversalImage/types'
import { useSvgData } from 'ui/src/components/UniversalImage/utils'
import { Flex } from 'ui/src/components/layout/Flex'

export function SvgImage({ uri, size, autoplay, fallback }: SvgImageProps): JSX.Element | null {
  const svgData = useSvgData(uri, autoplay)

  if (!svgData?.content || !svgData?.aspectRatio) {
    return fallback ?? <Flex />
  }

  // TODO handle style={{ backgroundColor, borderRadius }}
  return (
    <SvgXml
      height={size.height}
      style={{ aspectRatio: size.aspectRatio ?? svgData.aspectRatio }}
      width={size.width}
      xml={svgData.content}
    />
  )
}
