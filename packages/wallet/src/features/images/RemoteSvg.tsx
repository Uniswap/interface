import { useCallback } from 'react'
import { View } from 'react-native'
import { parse, SvgXml } from 'react-native-svg'
import { logger } from 'wallet/src/features/logger/logger'
import { useAsyncData } from 'wallet/src/utils/hooks'
import serializeError from 'wallet/src/utils/serializeError'

type Props = {
  backgroundColor?: string
  borderRadius: number
  imageHttpUrl: string | undefined
  height: number
  width: number
}

export const RemoteSvg = ({
  backgroundColor,
  borderRadius,
  imageHttpUrl,
  height,
  width,
}: Props): JSX.Element | null => {
  const fetchSvg = useCallback(async () => {
    if (!imageHttpUrl) return
    try {
      const res = await fetch(imageHttpUrl)
      const svgStr = await res.text()
      parse(svgStr)
      return svgStr
    } catch (e) {
      logger.error(`Could not render svg from uri: ${imageHttpUrl}`, {
        tags: {
          file: 'mobile/src/components/images/RemoteSvg',
          function: 'fetchSvg',
          error: serializeError(e),
        },
      })
    }
  }, [imageHttpUrl])

  const { data: svg } = useAsyncData(fetchSvg)

  if (!svg) return <View />
  return (
    <SvgXml height={height} style={{ backgroundColor, borderRadius }} width={width} xml={svg} />
  )
}
