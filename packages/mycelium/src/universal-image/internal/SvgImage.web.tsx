import type { JSX } from 'react'
import type { SvgImageProps } from '../types'
import { PlainImage } from './PlainImage'

export function SvgImage({ alt, uri, size, fallback, style, resizeMode, onError }: SvgImageProps): JSX.Element | null {
  // Since this would violate HTTP CSP for images to use the direct data
  // from a fetch call, we use plain image for SVG's on web
  return (
    <PlainImage
      alt={alt}
      fallback={fallback}
      resizeMode={resizeMode}
      size={size}
      style={style}
      uri={uri}
      onError={onError}
    />
  )
}
