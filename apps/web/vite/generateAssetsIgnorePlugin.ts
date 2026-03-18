import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Vite plugin that generates a .assetsignore file in the client assets directory.
 * This file is used by Cloudflare Workers to exclude certain files from deployment.
 *
 * @see https://developers.cloudflare.com/workers/static-assets/binding/#ignoring-assets
 *
 * @param enabled - Whether the plugin should run
 * @param projectRoot - The root directory of the project
 */
// This plugin is used in vite.config.mts
// eslint-disable-next-line import/no-unused-modules
export function generateAssetsIgnorePlugin(enabled: boolean, projectRoot: string): Plugin {
  return {
    name: 'generate-assets-ignore',
    writeBundle() {
      if (!enabled) {
        return
      }

      const clientDir = path.resolve(projectRoot, 'build/client')
      const assetsIgnorePath = path.join(clientDir, '.assetsignore')

      // Ensure the client directory exists
      if (!fs.existsSync(clientDir)) {
        return
      }

      // Create .assetsignore file with patterns to exclude sourcemaps
      const ignoreContent = [
        '# Exclude sourcemap files from Cloudflare deployment',
        '# These are uploaded to Datadog separately for error tracking',
        '**/*.map',
        '',
      ].join('\n')

      fs.writeFileSync(assetsIgnorePath, ignoreContent, 'utf-8')

      // biome-ignore lint/suspicious/noConsole: Required for build debugging
      console.log('✓ Generated .assetsignore file to exclude sourcemaps from Cloudflare deployment')
    },
  }
}
