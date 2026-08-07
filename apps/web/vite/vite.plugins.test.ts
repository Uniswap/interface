import type { ResolvedConfig } from 'vite'
import { describe, expect, it } from 'vitest'
import { cspMetaTagPlugin } from './vite.plugins'

const HTML = '<!-- CSP will be injected here -->'
const ASSET_BASE_URL_ORIGIN = 'https://cdn.app.unihq.org'
const ASSET_DIRECTIVES = [
  'script-src',
  'style-src',
  'font-src',
  'img-src',
  'media-src',
  'connect-src',
  'worker-src',
]

type TransformIndexHtml = (html: string) => string | Promise<string>
type ConfigResolved = (config: ResolvedConfig) => void | Promise<void>

async function renderCsp(mode: string, base: string): Promise<string> {
  const plugin = cspMetaTagPlugin(mode)

  const configResolved = plugin.configResolved
  if (typeof configResolved !== 'function') {
    throw new Error('Expected cspMetaTagPlugin to expose configResolved')
  }
  await (configResolved as ConfigResolved)({ base } as ResolvedConfig)

  const transformIndexHtml = plugin.transformIndexHtml
  if (typeof transformIndexHtml !== 'function') {
    throw new Error('Expected cspMetaTagPlugin to expose transformIndexHtml')
  }

  const html = await (transformIndexHtml as TransformIndexHtml)(HTML)
  const match = html.match(/content="([^"]+)"/)
  if (!match) {
    throw new Error('Expected CSP meta content')
  }
  return match[1]
}

function parseDirectives(cspContent: string): Map<string, string[]> {
  const decodedCspContent = cspContent.replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&')

  return new Map(
    decodedCspContent.split('; ').map((directive) => {
      const [name, ...values] = directive.split(/\s+/)
      return [name, values]
    }),
  )
}

describe('cspMetaTagPlugin', () => {
  it('allows the resolved cross-origin base for CDN-served ECS assets', async () => {
    const directives = parseDirectives(await renderCsp('staging', `${ASSET_BASE_URL_ORIGIN}/`))

    for (const directive of ASSET_DIRECTIVES) {
      expect(directives.get(directive)).toContain(ASSET_BASE_URL_ORIGIN)
    }
  })

  it('does not add CSP sources for same-origin asset base paths', async () => {
    const directives = parseDirectives(await renderCsp('staging', '/assets/'))

    for (const directive of ASSET_DIRECTIVES) {
      expect(directives.get(directive)).not.toContain('/assets')
    }
  })
})
