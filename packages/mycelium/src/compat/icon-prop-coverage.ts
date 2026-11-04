/**
 * The documented-rejected half of the mycelium icon style-prop boundary
 * (INFRA-3320).
 *
 * `SUPPORTED_ICON_STYLE_PROPS` (icon-props.ts) is the supported half: the
 * legacy `ui/src` icon style props mycelium icons accept first-class, so a
 * conversion is a pure import swap. Every other style prop the repo-wide icon
 * call-site census found is listed HERE with the reason it stays out, and
 * `icon-prop-coverage.test.ts` pins supported ∪ rejected = the census's
 * 42-prop universe exactly — so the boundary only ever moves by an explicit
 * decision, and a converter can read it before starting a batch instead of
 * discovering it one manual-lane flag at a time.
 *
 * The split is a data decision, not a taste one: census of all 1,396 ui/src
 * icon call sites across 744 files (2026-08-05), published with per-prop
 * occurrence counts on INFRA-3320. Everything the compat style machinery can
 * already express is supported (the ruling: icon styling stays the same
 * through the migration); the seven rejections below are animation-driver
 * props and single-call-site wrapper-shaped usages. `position`/`left` moved
 * to the supported half (INFRA-3320 widening) once a real call site
 * (packages/wallet ChooseNftModal.tsx's absolutely-positioned close icon)
 * needed them — the "wrapper-shaped, fix at the call site" reasoning that
 * held them out was a cold-prop deferral, not a substantive rejection.
 */
import { isDevelopmentBuild } from './compose'
import { lookupToken } from './tokens'

/**
 * Tamagui animation-driver surface: timing/driver configs the CSS side has no
 * counterpart for. The dominant carrier is the RotatableChevron wrapper, not a
 * generated icon.
 */
const ANIMATION_DRIVER = [
  'Tamagui animation-driver prop with no compat counterpart; the live usages ride the RotatableChevron wrapper',
  '— not a generated-icon surface.',
].join(' ')

/** One badge-shaped call site (apps/web UniswapWalletOptions.tsx) styling the icon's box. */
const BADGE_BOX_ON_WRAPPER = [
  'single call site styling an icon as a badge (apps/web UniswapWalletOptions.tsx); the badge box belongs on',
  'a wrapper element — fix at the call site instead of widening the icon surface.',
].join(' ')

/**
 * Every style prop from the INFRA-3320 icon call-site census that mycelium
 * icons deliberately reject, with the reason. Keys are the JSX attribute
 * spellings a legacy call site uses. At runtime the factory throws on these in
 * development/test builds (production drops them with a bounded warning) —
 * see `reportRejectedIconProp` below.
 */
export const REJECTED_ICON_PROPS: Readonly<Record<string, string>> = {
  animation: ANIMATION_DRIVER,
  transition: [
    'every live value is a dynamic Tamagui transition object, not a CSS string — it rides the animation-driver',
    'family; if plain CSS is meant, write it via `style` at the call site.',
  ].join(' '),
  animateOnly: ANIMATION_DRIVER,
  backgroundColor: BADGE_BOX_ON_WRAPPER,
  borderRadius: BADGE_BOX_ON_WRAPPER,
  x: [
    'Tamagui translateX shorthand shadowing the SVG `x` attribute — the intent is ambiguous on an svg element;',
    'write a CSS transform at the call site instead.',
  ].join(' '),
  rotateZ: ['Tamagui transform shorthand — write `transform`/`rotate` at the call site instead.'].join(' '),
}

// ── Runtime enforcement (the ledger's other half) ──────────────────────

/** Production-only dedupe (bounded by the ledger's size). */
const warnedRejectedIconProps = new Set<string>()

/** Test hook: reset the production warn-dedupe state. */
export function resetRejectedIconPropWarnings(): void {
  warnedRejectedIconProps.clear()
}

/**
 * A ledger-rejected prop reached the factory (spread/cast call sites — the
 * typed surface excludes them). Dev/test builds throw with the ledger reason;
 * production drops the prop (not a valid SVG attribute on any of the nine)
 * and warns once per prop — the `reportOutOfSetClass` fail-closed posture.
 */
export function reportRejectedIconProp(prop: string): void {
  const reason = lookupToken(REJECTED_ICON_PROPS, prop) ?? 'not part of the supported icon style surface'
  if (isDevelopmentBuild()) {
    throw new Error(
      `mycelium icons: prop "${prop}" is deliberately rejected — ${reason} ` +
        `(boundary ledger: packages/mycelium/src/compat/icon-prop-coverage.ts, INFRA-3320)`,
    )
  }
  if (warnedRejectedIconProps.has(prop)) {
    return
  }
  warnedRejectedIconProps.add(prop)
  // oxlint-disable-next-line no-console -- production-only diagnostic; the dev build throws instead
  console.warn(`mycelium icons: dropping rejected prop "${prop}" — ${reason}`)
}
