#!/usr/bin/env bun
/**
 * Prints the @expo/fingerprint hash of the mobile app's native surface for one platform.
 *
 * Used by CI (mobile_js_only_build.yml) to decide whether a commit needs a full native
 * build or can reuse a cached native baseline and just re-bundle the JS (repack).
 * Configuration (sourceSkips + extraSources hardening) lives in fingerprint.config.js.
 *
 * Usage: bun scripts/getFingerprintHash.ts <ios|android>
 */
import { createProjectHashAsync } from '@expo/fingerprint'

async function main(): Promise<void> {
  const platform = process.argv[2]
  if (platform !== 'ios' && platform !== 'android') {
    console.error('Usage: bun scripts/getFingerprintHash.ts <ios|android>')
    process.exit(1)
  }

  const hash = await createProjectHashAsync(process.cwd(), {
    platforms: [platform],
    silent: true,
  })
  console.log(hash)
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`Failed to generate fingerprint: ${errorMessage}`)
  process.exit(1)
})
