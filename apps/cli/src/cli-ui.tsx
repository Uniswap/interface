#!/usr/bin/env bun
import { App } from '@universe/cli/src/ui/App'
import { render } from 'ink'
// Ensure React is loaded before ink
import React from 'react'

export async function runUI(): Promise<void> {
  // Check for API key
  if (!process.env.ANTHROPIC_API_KEY) {
    // eslint-disable-next-line no-console
    console.error('Error: ANTHROPIC_API_KEY environment variable is required')
    // eslint-disable-next-line no-console
    console.error('Get your API key from: https://console.anthropic.com/')
    process.exit(1)
  }

  render(React.createElement(App))
}

// Run if executed directly
if (import.meta.main) {
  runUI().catch((error) => {
    // eslint-disable-next-line no-console
    console.error('Unhandled error:', error)
    process.exit(1)
  })
}
