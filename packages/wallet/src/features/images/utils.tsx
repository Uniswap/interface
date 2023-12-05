import { logger } from 'utilities/src/logger/logger'

const VIEWBOX_REGEX = /viewBox=["']\d+ \d+ (\d+) (\d+)["']/
const FALLBACK_ASPECT_RATIO = 1
// TODO: [MOB-205] return a nicer SVG asset with an error message
const INVALID_SVG = { content: 'Invalid SVG', aspectRatio: FALLBACK_ASPECT_RATIO }

export type SvgData = {
  content: string
  aspectRatio: number
}

export async function fetchSVG(
  uri: string,
  autoplay: boolean,
  signal?: AbortSignal
): Promise<SvgData> {
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
    aspectRatio =
      viewboxHeight && viewboxWidth ? +viewboxWidth / +viewboxHeight : FALLBACK_ASPECT_RATIO
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
