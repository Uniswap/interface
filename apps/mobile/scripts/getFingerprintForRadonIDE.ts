#!/usr/bin/env bun
import { createProjectHashAsync } from '@expo/fingerprint'

async function main(): Promise<void> {
  try {
    const projectRoot = process.cwd()
    const hash = await createProjectHashAsync(projectRoot, {
      silent: true,
    })
    console.log(hash)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    console.error(`Failed to generate fingerprint: ${errorMessage}`)
    process.exit(1)
  }
}

main().catch((error) => {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error(`Fatal error: ${errorMessage}`)
  process.exit(1)
})
