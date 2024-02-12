import { Image, ImageResizeMode } from 'react-native'
import { isSVGUri, uriToHttp } from 'utilities/src/format/urls'
import { logger } from 'utilities/src/logger/logger'
import { RemoteSvg } from './RemoteSvg'

type Props = {
  aspectRatio?: number
  backgroundColor?: string
  borderRadius?: number
  uri: string
  height: number
  width: number
  fallback?: JSX.Element
}

const RESIZE_MODE_CONTAIN: ImageResizeMode = 'contain'

export function RemoteImage({
  aspectRatio,
  backgroundColor,
  borderRadius = 0,
  uri,
  height,
  width,
  fallback,
}: Props): JSX.Element | null {
  const imageHttpUrl = uriToHttp(uri)[0]

  if (!imageHttpUrl) {
    logger.warn('RemoteImage', '', `Could not retrieve and format remote image for uri: ${uri}`)
    return fallback ?? null
  }

  if (isSVGUri(imageHttpUrl)) {
    return (
      <RemoteSvg
        backgroundColor={backgroundColor}
        borderRadius={borderRadius}
        height={height}
        imageHttpUrl={imageHttpUrl}
        width={width}
      />
    )
  }

  const style = {
    aspectRatio,
    flex: aspectRatio ? 1 : undefined,
    backgroundColor,
    borderRadius,
    resizeMode: RESIZE_MODE_CONTAIN,
    width: !aspectRatio ? width : undefined,
    height: !aspectRatio ? height : undefined,
  }

  return <Image source={{ uri: imageHttpUrl }} style={style} />
}
