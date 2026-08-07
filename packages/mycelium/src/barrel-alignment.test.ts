import { describe, expect, it } from 'vitest'
import * as myceliumBarrel from './index'

/**
 * Mirrors `CONVERTIBLE_BARREL_SPECIFIERS` in
 * `scripts/tamagui-migration/codemod/rules.ts` (INFRA-2957, PR #37009). The
 * codemod is not on main yet, so the set is mirrored here rather than
 * imported; once it lands, re-point this at the real export. Keep the two in
 * sync: the codemod rewrites legacy barrel imports of these names to
 * `@universe/mycelium`, so every name it converts must resolve from the root
 * barrel (INFRA-3040).
 */
const CONVERTIBLE_BARREL_SPECIFIERS: ReadonlySet<string> = new Set(['Flex', 'Text', 'TouchableArea'])

/**
 * Convertible names whose root-barrel promotion is still in flight. An entry
 * flips the assertion from "must resolve" to "must not resolve yet": the
 * moment the promotion PR lands, the flipped assertion goes red and forces
 * the entry's removal, so a listed gap can never rot into a silent one.
 */
const IN_FLIGHT_PROMOTIONS: ReadonlyMap<string, string> = new Map([])

// SAFETY: string-indexed view of the module namespace so a missing export is
// a failing assertion (a red test) instead of a compile error.
const barrelExports = myceliumBarrel as Record<string, unknown>

const promotedNames = [...CONVERTIBLE_BARREL_SPECIFIERS].filter((name) => !IN_FLIGHT_PROMOTIONS.has(name))

describe('root barrel ↔ codemod convertible set (INFRA-3040)', () => {
  it('IN_FLIGHT_PROMOTIONS only names convertible specifiers', () => {
    for (const name of IN_FLIGHT_PROMOTIONS.keys()) {
      expect(
        CONVERTIBLE_BARREL_SPECIFIERS.has(name),
        `'${name}' is allowlisted as an in-flight promotion but is not in the convertible set — delete the stale entry.`,
      ).toBe(true)
    }
  })

  it.each(promotedNames)('exports %s', (name) => {
    expect(
      barrelExports[name],
      `'${name}' is in the codemod convertible set but the @universe/mycelium root barrel does not export it — ` +
        `every mechanically converted import of '${name}' fails to resolve. ` +
        `Promote the compat component (FlexCompat precedent #36905) or remove '${name}' from CONVERTIBLE_BARREL_SPECIFIERS.`,
    ).toBeDefined()
  })

  it.each([...IN_FLIGHT_PROMOTIONS])('%s stays a known gap until its promotion lands', (name, promotionPr) => {
    expect(
      barrelExports[name],
      `'${name}' now resolves from the root barrel — its promotion (${promotionPr}) has landed. ` +
        `Delete the IN_FLIGHT_PROMOTIONS entry for '${name}' so this gap can never silently reopen.`,
    ).toBeUndefined()
  })
})
