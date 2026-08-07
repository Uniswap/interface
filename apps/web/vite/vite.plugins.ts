import fs from 'fs'
import path from 'path'
import type { Plugin, ResolvedConfig } from 'vite'

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
}

const ASSET_BASE_URL_CSP_DIRECTIVES = [
  'scriptSrc',
  'styleSrc',
  'fontSrc',
  'imgSrc',
  'mediaSrc',
  'connectSrc',
  'workerSrc',
] as const

function getCrossOriginBase(base: string | undefined): string | undefined {
  if (!base || base === '/') {
    return undefined
  }

  try {
    return new URL(base).origin
  } catch {
    return undefined
  }
}

// This plugin is used in vite.config.mts
// oxlint-disable-next-line import/no-unused-modules
export function cspMetaTagPlugin(mode?: string, envValues?: Record<string, string>): Plugin {
  let resolvedBase: string | undefined

  return {
    name: 'inject-csp-meta',

    configResolved(config: ResolvedConfig) {
      resolvedBase = config.base
    },

    transformIndexHtml(html) {
      const env = mode ?? process.env.NODE_ENV ?? 'development'
      const skip = process.env.SKIP_CSP === 'true'

      if (skip) {
        return html
      }

      // Load base CSP - adjust path to be relative to the project root
      const baseCSPPath = path.resolve(process.cwd(), 'public', 'csp.json')
      const baseCSP = JSON.parse(fs.readFileSync(baseCSPPath, 'utf-8'))

      // Optionally extend with dev/staging
      const envConfigFile = env === 'development' ? 'dev-csp.json' : env === 'staging' ? 'staging-csp.json' : null

      if (envConfigFile) {
        const extraCSPPath = path.resolve(process.cwd(), 'public', envConfigFile)
        const extraCSP = JSON.parse(fs.readFileSync(extraCSPPath, 'utf-8'))
        for (const [key, value] of Object.entries(extraCSP)) {
          if (Array.isArray(value)) {
            baseCSP[key] = [...new Set([...(baseCSP[key] || []), ...value])]
          }
        }
      }

      // Cross-origin asset base (ECS CDN): 'self' no longer covers JS/CSS/fonts/workers.
      const assetBaseUrlOrigin = getCrossOriginBase(resolvedBase)
      if (assetBaseUrlOrigin) {
        for (const directive of ASSET_BASE_URL_CSP_DIRECTIVES) {
          baseCSP[directive] = [...new Set([...(baseCSP[directive] || []), assetBaseUrlOrigin])]
        }
      }

      const tradingApiUrlOverride = envValues?.TRADING_API_URL_OVERRIDE
      if (tradingApiUrlOverride) {
        if (!baseCSP.connectSrc.includes(tradingApiUrlOverride)) {
          baseCSP.connectSrc.push(tradingApiUrlOverride)
        }
      }

      // E2E-only: the hermetic WalletConnect relay runs on a local ws port (see
      // src/playwright/wc/localRelay.ts). Allow a localhost ws origin in connect-src only for the
      // e2e build, keeping the prod policy (csp.json) free of any localhost ws.
      if (envValues?.IS_E2E_TEST === 'true') {
        const localWsOrigin = 'ws://127.0.0.1:*'
        if (!baseCSP.connectSrc.includes(localWsOrigin)) {
          baseCSP.connectSrc.push(localWsOrigin)
        }
      }

      // Transform the CSP content using the directive map
      const cspContent = Object.entries(baseCSP)
        .map(([key, values]) => {
          const directive = CSP_DIRECTIVE_MAP[key]
          if (!directive) {
            // Log unknown directives in development only
            if (env === 'development') {
              // oxlint-disable-next-line no-console -- Required for Vite build debugging
              console.warn(`Unknown CSP directive: ${key}`)
            }
            return null
          }
          return `${directive} ${(values as string[]).join(' ')}`
        })
        .filter(Boolean)
        .join('; ')

      const escapedContent = cspContent
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')

      // Replace the comment with the CSP meta tag
      return html.replace(
        /<!-- CSP will be injected here -->/,
        `<meta http-equiv="Content-Security-Policy" content="${escapedContent}">`,
      )
    },
  }
}
