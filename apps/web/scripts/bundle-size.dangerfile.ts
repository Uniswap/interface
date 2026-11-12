import { existsSync, readFileSync } from 'fs'
import { markdown } from 'danger'

// Written by check-client-build.ts; Danger runs from the repo root.
const reportFile = 'apps/web/build/bundle-size-report.md'

if (existsSync(reportFile)) {
  markdown(readFileSync(reportFile, 'utf-8'))
}
