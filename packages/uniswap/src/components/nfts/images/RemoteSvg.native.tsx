import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { parse, SvgXml } from 'react-native-svg'
import { Flex } from 'ui/src'
import { RemoteSvgProps } from 'uniswap/src/components/nfts/images/RemoteSvg'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * @deprecated Please use `UniversalImage` for all added cases
 */
export const RemoteSvg = ({
  backgroundColor,
  borderRadius,
  imageHttpUrl,
  height,
  width,
}: RemoteSvgProps): JSX.Element | null => {
  const fetchSvg = useCallback(async () => {
    if (!imageHttpUrl) {
      return undefined
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
      return undefined
    }
  }, [imageHttpUrl])

  const { data: svg } = useQuery({
    queryKey: [ReactQueryCacheKey.RemoteSvg, imageHttpUrl],
    queryFn: fetchSvg,
  })

  if (!svg) {
    return <Flex />
  }
  return <SvgXml height={height} style={{ backgroundColor, borderRadius }} width={width} xml={svg} />
}
