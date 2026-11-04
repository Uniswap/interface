import { describe, expect, it } from 'vitest'
import { RADIUS_TOKEN_PX, Z_INDEX_TOKEN, type SporeSpaceToken } from './compat/tokens'
import { getTokenValue } from './get-token-value'
import { borderRadii, iconSizes, imageSizes, spacing, zIndexes } from './tokens'

/**
 * Token-constants compat (INFRA-2951): the families' values are pinned to
 * css/theme.css by packages/tailwind/src/tokens.guard.test.ts; this suite pins
 * how mycelium's `$`-token maps and `getTokenValue` derive from them. The
 * `fonts` legs are covered by font-tokens.platform-legs.test.ts.
 */

describe('mycelium token compat', () => {
  /**
   * The `$`-prefixed compat token maps mirror the legacy Tamagui token
   * families, which add a `true` default alias on top of the base constants
   * (`ui/src/theme/tokens.ts`: `zIndex = { ...zIndexes, true: zIndexes.default }`,
   * `radius = { ...borderRadii, true: borderRadii.none }`) — INFRA-3232.
   */
  it('Z_INDEX_TOKEN mirrors the legacy zIndex token map', () => {
    expect(Z_INDEX_TOKEN).toEqual(
      Object.fromEntries(
        Object.entries({ ...zIndexes, true: zIndexes.default }).map(([key, value]) => [`$${key}`, value]),
      ),
    )
  })

  it('RADIUS_TOKEN_PX mirrors the legacy radius token map', () => {
    expect(RADIUS_TOKEN_PX).toEqual(
      Object.fromEntries(
        Object.entries({ ...borderRadii, true: borderRadii.none }).map(([key, value]) => [`$${key}`, value]),
      ),
    )
  })

  // getTokenValue must return what the legacy Tamagui resolver returned for
  // every covered category; unknown tokens throw instead of Tamagui's silent undefined.
  describe('getTokenValue', () => {
    it('space/size tokens resolve to the legacy spacing/padding/gap values', () => {
      // The migrating call sites' exact tokens first (FavoriteTokensGrid,
      // PlanStepItem/StepRowSkeleton constants), then the whole family.
      expect(getTokenValue('$spacing8')).toBe(spacing.spacing8)
      const legacySpace: Record<string, number> = {
        ...spacing,
        // ui/src/theme/spacing.ts padding/gap families (derived from spacing).
        padding6: 6,
        padding8: 8,
        padding12: 12,
        padding16: 16,
        padding20: 20,
        padding24: 24,
        padding36: 36,
        gap2: 2,
        gap4: 4,
        gap8: 8,
        gap12: 12,
        gap16: 16,
        gap20: 20,
        gap24: 24,
        gap32: 32,
        gap36: 36,
        true: spacing.spacing8,
      }
      for (const [name, value] of Object.entries(legacySpace)) {
        // SAFETY: every key above is a covered space token; the dynamic
        // template defeats the literal-union narrowing this test also pins.
        const token = `$${name}` as SporeSpaceToken
        expect(getTokenValue(token), name).toBe(value)
        expect(getTokenValue(token, 'space'), name).toBe(value)
        expect(getTokenValue(token, 'size'), name).toBe(value)
      }
    })

    it('icon tokens resolve to the legacy iconSize values (dotted specific-token names)', () => {
      expect(getTokenValue('$icon.20')).toBe(iconSizes.icon20)
      expect(getTokenValue('$icon.24', 'icon')).toBe(iconSizes.icon24)
      expect(getTokenValue('$icon.true')).toBe(iconSizes.icon40)
    })

    it('image tokens resolve to the legacy imageSize values', () => {
      expect(getTokenValue('$image.image40')).toBe(imageSizes.image40)
      expect(getTokenValue('$image.true', 'image')).toBe(imageSizes.image40)
    })

    it('radius and zIndex tokens resolve to the legacy values', () => {
      expect(getTokenValue('$rounded12', 'radius')).toBe(borderRadii.rounded12)
      expect(getTokenValue('$modal', 'zIndex')).toBe(zIndexes.modal)
      // Category-less flat names follow the legacy config's insertion order
      // (space before zIndex before radius): `$true` is the space alias.
      expect(getTokenValue('$true')).toBe(spacing.spacing8)
    })

    it('throws LOUDLY on unknown tokens and categories (never 0/undefined)', () => {
      // Uncovered tokens now also FAIL TYPECHECK at call sites (the
      // codemod's tsc-proves-the-swap premise); the @ts-expect-error pins
      // that compile-time half while the assertions pin the runtime throw
      // for widened-string escapes.
      // @ts-expect-error -- '$paddingBogus' is deliberately outside every covered category
      expect(() => getTokenValue('$paddingBogus')).toThrowError(/unknown token "\$paddingBogus"/)
      // @ts-expect-error -- '$spacing8000' is deliberately outside the space category
      expect(() => getTokenValue('$spacing8000', 'space')).toThrowError(/covered categories/)
      // @ts-expect-error -- 'auto' is a Tamagui passthrough value, deliberately uncovered
      expect(() => getTokenValue('auto')).toThrowError(/unknown token/)
      // A known token in the WRONG category is loud too.
      // @ts-expect-error -- '$icon.20' is an icon token, not a space token
      expect(() => getTokenValue('$icon.20', 'space')).toThrowError(/in category "space"/)
    })
  })
})
