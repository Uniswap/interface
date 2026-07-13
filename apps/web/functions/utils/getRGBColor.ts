import JPEG from 'jpeg-js'
import PNG from 'png-ts'
import { parseToRgb } from 'polished'
import { RgbaColor, RgbColor } from 'polished/lib/types/color'
import { SPECIAL_CASE_TOKEN_COLORS } from 'ui/src/utils/colors/specialCaseTokens'

// Maps to `#232B2B` — the neutral dark slate used as the OG-card accent
// when a token logo can't be color-averaged (missing, unreachable, decode
// failure, or any of the safety guards below).
const DEFAULT_COLOR = { red: 35, green: 43, blue: 43 }

/**
 * Hard upper bound on the response body. Image-color averaging just needs a
 * few hundred KB; anything larger is either malicious or a misconfigured
 * upstream and we'd rather drop it than spend Worker CPU on it.
 */
const MAX_IMAGE_BYTES = 2 * 1024 * 1024 // 2 MB
const FETCH_TIMEOUT_MS = 5_000

/**
 * Defensive scheme + host validator for the token logo URL we proxy through
 * `fetch()`.
 *
 * The URL flows in from the backend GraphQL response (`project.logoUrl`), so
 * it isn't directly user-controlled — but the same Bun-fetch / SSRF class
 * documented by Cantina #715 / #747 applies if the upstream ever returns a
 * `file://` / `data:` URL or an IP-literal hostname. Cloudflare Workers
 * restricts schemes to http/https in practice, but we enforce it explicitly
 * so the property holds regardless of runtime behavior.
 */
function isSafeImageUrl(url: URL): boolean {
  if (url.protocol !== 'https:') {
    return false
  }
  if (url.username !== '' || url.password !== '') {
    return false
  }
  // Reject IP-literal hostnames (`169.254.169.254` IMDS, `127.0.0.1`, `[::1]`).
  // The backend should always return DNS hostnames for token logos.
  // IPv4 = four decimal octets; IPv6 in WHATWG URLs is always bracket-wrapped.
  // (Previous attempts at `/^\[?[0-9a-f:.]+\]?$/i` falsely flagged real gTLD
  // hostnames like `dead.cafe` as IP literals — caught in PR review.)
  const host = url.hostname
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(host) || host.startsWith('[')) {
    return false
  }
  if (host === 'localhost') {
    return false
  }
  return true
}

export async function getRGBColor(imageUrl: string | undefined, checkDistance = false): Promise<RgbColor | RgbaColor> {
  if (!imageUrl) {
    return DEFAULT_COLOR
  }
  if (imageUrl in SPECIAL_CASE_TOKEN_COLORS) {
    return parseToRgb(SPECIAL_CASE_TOKEN_COLORS[imageUrl])
  }
  let parsed: URL
  try {
    parsed = new URL(imageUrl)
  } catch {
    return DEFAULT_COLOR
  }
  if (!isSafeImageUrl(parsed)) {
    return DEFAULT_COLOR
  }
  try {
    const data = await fetch(parsed, {
      redirect: 'error',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    // Pre-check Content-Length so a malicious or misconfigured upstream
    // can't blow the Worker's heap by sending a multi-GB body within the
    // 5s timeout — `data.arrayBuffer()` would otherwise allocate the
    // whole thing before the byteLength check below could fire. Post-read
    // check is still required because servers can lie about Content-Length.
    const contentLength = Number(data.headers.get('content-length') ?? 0)
    if (contentLength > MAX_IMAGE_BYTES) {
      return DEFAULT_COLOR
    }
    const arrayBuffer = await data.arrayBuffer()
    if (arrayBuffer.byteLength > MAX_IMAGE_BYTES) {
      return DEFAULT_COLOR
    }
    const buffer = Buffer.from(arrayBuffer)

    const type = data.headers.get('content-type') ?? ''
    return getAverageColor({ arrayBuffer: buffer, type, checkDistance })
  } catch {
    return DEFAULT_COLOR
  }
}

function getAverageColor({
  arrayBuffer,
  type,
  checkDistance,
}: {
  arrayBuffer: Uint8Array
  type: string
  checkDistance?: boolean
}) {
  let pixels
  switch (type) {
    case 'image/png': {
      const image = PNG.load(arrayBuffer)
      pixels = image.decode()
      break
    }
    case 'image/jpeg':
    case 'image/jpg': {
      const jpeg = JPEG.decode(arrayBuffer, { useTArray: true })
      pixels = jpeg.data
      break
    }
    default: {
      return DEFAULT_COLOR
    }
  }

  const pixelCount = pixels.length / 4

  let transparentPixels = 0

  let red = 0
  let green = 0
  let blue = 0

  for (let i = 0; i < pixelCount; i++) {
    if (pixels[i * 4 + 3] === 0) {
      transparentPixels++
      continue
    }
    red += pixels[i * 4]
    green += pixels[i * 4 + 1]
    blue += pixels[i * 4 + 2]
  }

  red = Math.floor(red / (pixelCount - transparentPixels))
  green = Math.floor(green / (pixelCount - transparentPixels))
  blue = Math.floor(blue / (pixelCount - transparentPixels))

  if (checkDistance) {
    const distance = Math.sqrt(Math.pow(red - 255, 2) + Math.pow(green - 255, 2) + Math.pow(blue - 255, 2))

    if (distance < 50) {
      return DEFAULT_COLOR
    }
  }

  return { red, green, blue }
}
