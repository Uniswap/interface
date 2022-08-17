import { logMessage } from 'src/features/telemetry'
import { LogContext } from 'src/features/telemetry/constants'
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

  // TODO: add a feature flag in here that will not render NFTs in a webview if malicious NFTs have been detected. The feature flag could check for a foreignObjectTag

  const formatted = autoplay ? text : freezeSvgAnimations(text)
  const result = VIEWBOX_REGEX.exec(text)

  const viewboxWidth = result?.[1]
  const viewboxHeight = result?.[2]

  if (!formatted) {
    logMessage(LogContext.ImageUtils, `Could not retrieve and format SVG content for uri: ${uri}`)
    logger.debug('images/utils', 'fetchSVG', 'Could not retrieve and format SVG content', uri)
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
