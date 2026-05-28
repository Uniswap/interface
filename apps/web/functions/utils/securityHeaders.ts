/**
 * HTTP security headers for Cloudflare Pages Functions.
 *
 * CSP is built dynamically from public/csp.json (bundled at compile time)
 * so that the HTTP-header CSP always stays in sync with the meta-tag CSP.
 */
import cspConfig from '../../public/csp.json'

const CSP_DIRECTIVE_MAP: Record<string, string> = {
  defaultSrc: 'default-src',
  scriptSrc: 'script-src',
  styleSrc: 'style-src',
  imgSrc: 'img-src',
  frameSrc: 'frame-src',
  connectSrc: 'connect-src',
  workerSrc: 'worker-src',
  mediaSrc: 'media-src',
  fontSrc: 'font-src',
  formAction: 'form-action',
  baseUri: 'base-uri',
  frameAncestors: 'frame-ancestors',
}

function buildCspString(config: Record<string, string[]>): string {
  const directives: string[] = []
  for (const [key, values] of Object.entries(config)) {
    const directive = CSP_DIRECTIVE_MAP[key]
    if (directive && Array.isArray(values)) {
      directives.push(`${directive} ${values.join(' ')}`)
    }
  }
  return directives.join('; ')
}

const CSP_STRING = buildCspString(cspConfig as unknown as Record<string, string[]>)

const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': CSP_STRING,
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export function addSecurityHeaders(response: Response): Response {
  const headers = new Headers(response.headers)
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    headers.set(key, value)
  }
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
