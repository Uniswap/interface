/**
 * Regenerate-and-diff guard for the workbench Flex parity class manifest:
 * recomputes the manifest from the live matrix + compiler and fails when the
 * checked-in `flex-parity.classes.txt` differs, so manifest drift can never
 * go stale silently.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { flexParityManifestFileContents } from './class-manifest'

const MANIFEST_PATH = join(
  dirname(fileURLToPath(import.meta.url)),
  '../../../../../labs/workbench/app/components/parity/flex-parity.classes.txt',
)

describe('workbench flex-parity class manifest', () => {
  it('the checked-in manifest matches a fresh regeneration', () => {
    const committed = readFileSync(MANIFEST_PATH, 'utf8')
    expect(
      committed,
      'labs/workbench/app/components/parity/flex-parity.classes.txt is stale — run `bun run generate:option-classes` in labs/workbench and commit the result',
    ).toBe(flexParityManifestFileContents())
  })
})
