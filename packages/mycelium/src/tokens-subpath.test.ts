/**
 * Token-only subpath contract (INFRA-3302).
 *
 * Non-UI token consumers import `@universe/mycelium/tokens` instead of the
 * component root barrel, so the `./tokens` exports-map entry must resolve on
 * its own. This imports through the package name (self-reference) — this
 * package's vitest config has no tsconfig-paths plugin, so the import only
 * resolves when package.json `exports` declares the subpath
 * (deep-import.test.tsx precedent).
 */
import * as tokensSubpath from '@universe/mycelium/tokens'
import { describe, expect, it } from 'vitest'
import * as tokensSource from './tokens'

describe('token-only subpath via exports map (INFRA-3302)', () => {
  it('exposes exactly the token constant families', () => {
    expect(Object.keys(tokensSubpath).sort()).toEqual([
      'NATIVE_LINE_HEIGHT_SCALE',
      'WEB_BASEL_FONT_STACK',
      'borderRadii',
      'defaultHitslop',
      'fonts',
      'heights',
      'iconSizes',
      'imageSizes',
      'spacing',
      'zIndexes',
    ])
  })

  it('serves the same values as src/tokens.ts', () => {
    expect(tokensSubpath).toEqual(tokensSource)
  })
})
