import fs from 'fs'
import path from 'path'
import type { Plugin } from 'vite'

/**
 * Vite plugin that writes version.json into the client output directory, recording the version
 * baked into the bundle (config.appVersion, which becomes the Datadog RUM `version`).
 *
 * Datadog only matches uploaded sourcemaps on service + version + filename, so the deploy asserts
 * this file against the release tag before uploading. Writing it from the same resolved value the
 * `process.env.VERSION` define uses is what keeps the two from drifting. See INFRA-3219.
 *
 * Served publicly alongside the other client assets — it holds only the version string the bundle
 * already exposes.
 *
 * @param enabled - Whether the plugin should run
 * @param version - The resolved version baked into the bundle
 * @param projectRoot - The root directory of the project
 */
// This plugin is used in vite.config.mts
// oxlint-disable-next-line import/no-unused-modules
export function generateVersionFilePlugin(enabled: boolean, version: string, projectRoot: string): Plugin {
  return {
    name: 'generate-version-file',
    apply: 'build',
    closeBundle() {
      if (!enabled) {
        return
      }

      const clientDir = path.resolve(projectRoot, 'build/client')
      fs.mkdirSync(clientDir, { recursive: true })
      fs.writeFileSync(path.join(clientDir, 'version.json'), `${JSON.stringify({ version }, null, 2)}\n`, 'utf-8')

      // oxlint-disable-next-line no-console -- Required for build debugging
      console.log(`✓ Generated version.json (version: ${version})`)
    },
  }
}
