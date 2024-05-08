import { useCallback } from 'react'
import { View } from 'react-native'
import { parse, SvgXml } from 'react-native-svg'
import { logger } from 'utilities/src/logger/logger'
import { useAsyncData } from 'utilities/src/react/hooks'

type Props = {
  backgroundColor?: string
  borderRadius?: number
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
    if (!imageHttpUrl) {
      return
    }
    try {
      const res = await fetch(imageHttpUrl)
      const svgStr = await res.text()
      parse(svgStr)
      return svgStr
    } catch (error) {
      logger.error(error, {
        tags: { file: 'RemoteSvg', function: 'fetchSvg' },
        extra: { imageHttpUrl },
      })
    }
  }, [imageHttpUrl])

  const { data: svg } = useAsyncData(fetchSvg)

  if (!svg) {
    return <View />
  }
  return (
    <SvgXml height={height} style={{ backgroundColor, borderRadius }} width={width} xml={svg} />
  )
}
