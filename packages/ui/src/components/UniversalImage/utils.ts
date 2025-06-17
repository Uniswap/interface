import { useQuery } from '@tanstack/react-query'
import { useCallback } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

const VIEWBOX_REGEX = /viewBox=["']\d+ \d+ (\d+) (\d+)["']/
const FALLBACK_ASPECT_RATIO = 1
const INVALID_SVG = { content: 'Invalid SVG', aspectRatio: FALLBACK_ASPECT_RATIO }

export type SvgData = {
  content: string
  aspectRatio: number
}

export async function fetchSVG({
  uri,
  autoplay,
  signal,
}: {
  uri: string
  autoplay: boolean
  signal?: AbortSignal
}): Promise<SvgData> {
  const res = await fetch(uri, { signal })
  const text = await res.text()

  const formatted = autoplay ? text : freezeSvgAnimations(text)
  const result = VIEWBOX_REGEX.exec(text)

  const viewboxWidth = result?.[1]
  const viewboxHeight = result?.[2]

  if (!formatted) {
    logger.warn('images/utils', 'fetchSVG', `Could not retrieve and format SVG content ${uri}`)
    return INVALID_SVG
  }

  let aspectRatio = FALLBACK_ASPECT_RATIO
  try {
    aspectRatio = viewboxHeight && viewboxWidth ? +viewboxWidth / +viewboxHeight : FALLBACK_ASPECT_RATIO
  } catch (e) {
    logger.debug('images/utils', 'fetchSVG', 'Could not calculate aspect ratio ' + e)
  }

  return { content: formatted, aspectRatio }
}

function freezeSvgAnimations(svg: string): string {
  // Replaces `<animate>` tag with a 'hidden' presentation group
  //      which shouldn't affect the SVG validity
  // NOTE: `fill="freeze"` on `<animate>` tags had no effect
  return svg.replace(/<animate /g, '<group ')
}

export function useSvgData(uri: string, autoplay = false): SvgData | undefined {
  const fetchSvgData = useCallback(
    async (signal?: AbortSignal): Promise<SvgData | undefined> => {
      try {
        return await fetchSVG({ uri, autoplay, signal })
      } catch (error) {
        logger.error(error, { tags: { file: 'WebSvgUri', function: 'fetchSvg' }, extra: { uri } })
        return undefined
      }
    },
    [autoplay, uri],
  )

  const { data } = useQuery({
    queryKey: [ReactQueryCacheKey.RemoteSvg, uri],
    queryFn: ({ signal }) => fetchSvgData(signal),
  })

  return data
}
