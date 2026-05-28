import { PlainImage } from 'ui/src/components/UniversalImage/internal/PlainImage'
import { type SvgImageProps } from 'ui/src/components/UniversalImage/types'

export function SvgImage({ uri, size, fallback, style, resizeMode, onError }: SvgImageProps): JSX.Element | null {
  // Since this would violate HTTP CSP for images to use the direct data
  // from a fetch call, we use plain image for SVG's on web
  return (
    <PlainImage fallback={fallback} resizeMode={resizeMode} size={size} style={style} uri={uri} onError={onError} />
  )
}
