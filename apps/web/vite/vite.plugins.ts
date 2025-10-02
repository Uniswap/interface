import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

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
export function cspMetaTagPlugin(): Plugin {
  return {
    name: 'inject-csp-meta',

    transformIndexHtml(html) {
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      const env = process.env.NODE_ENV ?? 'development'
      const skip = process.env.VITE_SKIP_CSP === 'true'

      if (skip) {
        return html
      }

      // Load base CSP - adjust path to be relative to the project root
      const baseCSPPath = path.resolve(process.cwd(), 'public', 'csp.json')
      const baseCSP = JSON.parse(fs.readFileSync(baseCSPPath, 'utf-8'))

      // Optionally extend with dev/staging
      const envConfigFile =
        env === 'development' ? 'dev-csp.json' : process.env.VITE_STAGING === 'true' ? 'vercel-csp.json' : null

      if (envConfigFile) {
        const extraCSPPath = path.resolve(process.cwd(), 'public', envConfigFile)
        const extraCSP = JSON.parse(fs.readFileSync(extraCSPPath, 'utf-8'))
        for (const [key, value] of Object.entries(extraCSP)) {
          if (Array.isArray(value)) {
            baseCSP[key] = [...new Set([...(baseCSP[key] || []), ...value])]
          }
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
