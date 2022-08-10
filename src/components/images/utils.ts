import { logger } from 'src/utils/logger'

const VIEWBOX_REGEX = /viewBox=["']\d+ \d+ (\d+) (\d+)["']/
const FALLBACK_ASPECT_RATIO = 1
// TODO: return a nicer SVG asset with an error message
const INVALID_SVG = { content: 'Invalid SVG', aspectRatio: FALLBACK_ASPECT_RATIO }

export async function fetchSVG(
  uri: string,
  autoplay: boolean,
  signal?: AbortSignal
): Promise<{ content: string; aspectRatio: number }> {
  const res = await fetch(uri, { signal })
  const text = await res.text()

  // Do not render SVGs that have a foreignObject tag for security reasons
  if (text.includes('<foreignObject')) {
    // TODO: log with Sentry
    logger.info('images/utils', 'fetchSVG', 'SVG content contains a foreignObject tag', uri)
    return INVALID_SVG
  }

  const formatted = autoplay ? text : freezeSvgAnimations(text)
  const result = VIEWBOX_REGEX.exec(text)

  const viewboxWidth = result?.[1]
  const viewboxHeight = result?.[2]

  if (!formatted) {
    // TODO: log with Sentry
    logger.info('images/utils', 'fetchSVG', 'Could not retrieve and format SVG content', uri)
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

function freezeSvgAnimations(svg: string) {
  // Replaces `<animate>` tag with a 'hidden' presentation group
  //      which shouldn't affect the SVG validity
  // NOTE: `fill="freeze"` on `<animate>` tags had no effect
  return svg.replace(/<animate /g, '<group ')
}
