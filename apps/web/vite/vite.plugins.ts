import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

const LOCAL_ENV = '.env.local'

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

// This plugin is used in vite.config.mts
// eslint-disable-next-line import/no-unused-modules
export function cspMetaTagPlugin(mode?: string): Plugin {
  return {
    name: 'inject-csp-meta',

    transformIndexHtml(html) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const env = mode ?? process.env.NODE_ENV ?? 'development'
      const skip = process.env.VITE_SKIP_CSP === 'true'

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

      const tradingApiUrlOverride = getLocalEnvUrl('REACT_APP_TRADING_API_URL_OVERRIDE')
      if (tradingApiUrlOverride) {
        if (!baseCSP.connectSrc.includes(tradingApiUrlOverride)) {
          baseCSP.connectSrc.push(tradingApiUrlOverride)
        }
      }

      // Transform the CSP content using the directive map
      const cspContent = Object.entries(baseCSP)
        .map(([key, values]) => {
          const directive = CSP_DIRECTIVE_MAP[key]
          if (!directive) {
            // Log unknown directives in development only
            if (env === 'development') {
              // biome-ignore lint/suspicious/noConsole: Required for Vite build debugging
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

/**
 * For development builds, gets the target envUrlKey from the local env
 * file and returns the value.
 */
/**
 * For development builds, gets the target envUrlKey from the local env
 * file and returns the value.
 */
const getLocalEnvUrl = (envUrlKey: string) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return null
    }
    const localEnvPath = path.resolve(process.cwd(), LOCAL_ENV)
    if (fs.existsSync(localEnvPath)) {
      const envContent = fs.readFileSync(localEnvPath, 'utf-8')
      const lines = envContent.split('\n')

      for (const line of lines) {
        const trimmedLine = line.trim()
        if (!trimmedLine || trimmedLine.startsWith('#')) {
          continue
        }
        if (trimmedLine.startsWith(`${envUrlKey}=`)) {
          const value = trimmedLine.split('=')[1]?.trim() || ''
          if (value) {
            try {
              new URL(value)
              return value
            } catch (_e) {
              // biome-ignore lint/suspicious/noConsole: Required for Vite build debugging
              console.warn(`Invalid URL found for ${envUrlKey}: ${value}`)
              return null
            }
          }
        }
      }
    }
    return null
  } catch (error) {
    // biome-ignore lint/suspicious/noConsole: Required for Vite build debugging
    console.error(`Error retrieving environment URL for ${envUrlKey}:`, error)
    return null
  }
}
