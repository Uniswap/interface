/* eslint-disable no-console */
// This ensures the web app entry js size is under a limit

// NOTE: not using a typical jest/.test.ts file because this test requires the
// production app to be built, so we want to be able to run it separately in CI

import { readFileSync } from 'fs'
import { join } from 'path'

type BundleAnalysisJson = {
  statSize?: number
  parsedSize?: number
  gzipSize?: number
  isInitialByEntrypoint: { main?: boolean }
}[]

let report: BundleAnalysisJson

try {
  const outputfile = join(__dirname, '../../build/report.json')
  report = JSON.parse(readFileSync(outputfile, 'utf-8'))
} catch (err) {
  console.error(`Missing bundle analysis json ${err.message}`)
  process.exit(1)
}

const entryGzipSize = report.reduce(
  (acc, r) =>
    acc +
    // only collect the entry point size to keep things simple
    (r.isInitialByEntrypoint?.main ? r.gzipSize || 0 : 0),
  0,
)

// somewhat arbitrary, based on current size (2/11/2025)
const limit = 2_400_000
if (entryGzipSize > limit) {
  console.error(`Bundle size has grown too big! Entry JS size is ${entryGzipSize}, over the limit of ${limit}.`)
  process.exit(1)
}

console.info(`Success! Entry JS size is ${entryGzipSize}, less than the limit of ${limit}.`)
