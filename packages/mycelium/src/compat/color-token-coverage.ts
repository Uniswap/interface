/**
 * The documented-rejected half of the compat colour boundary.
 *
 * `COLOR_TOKEN_CLASS` + `THEMED_COLOR_TOKEN_CLASSES` (tokens.ts) are the
 * supported half: the `ui/src` theme colour tokens the compat compilers map to
 * real `@universe/tailwind` utilities. Every other token the legacy theme
 * resolves is listed HERE with the reason it stays a hard compile error. For
 * the life of the migration, supported ∪ rejected was pinned to equal the
 * `ui/src` theme's token set exactly, so every legacy token landed in one of
 * the two lists by an explicit decision; the lists remain the documented
 * boundary a reader consults before touching compat colour handling.
 *
 * The split is a data decision, not a taste one: a census of the then-71
 * rejected tokens across the 2,080-file Tamagui frontier (frontier = the
 * INFRA-2351 import census, `packages/ui` excluded; 2026-08-04, main
 * @ bd526562) found 23 in use with 169 total occurrences. The 17 widened
 * tokens cover 121 of those occurrences; `$shadowColor`/`$shadowColorHover`
 * (28 more, the hottest deferred family) were widened once the native-CSS
 * entry settled; every remaining occurrence is accounted for by a reason
 * below.
 */

/**
 * Design re-pointed `accent3` at `neutral1` (decision recorded in
 * `@universe/tailwind/css/theme.css`), and the legacy palette now matches. The
 * alias stays rejected so new code names the real token.
 */
const DEPRECATED_REPOINTED = 'deprecated alias of neutral1 — use $neutral1 / $neutral1Hovered instead.'

/** Legacy-only deprecated palette (9 tokens, 8 frontier occurrences total). */
const DEPRECATED_PALETTE =
  'deprecated legacy palette entry; convert the call site to a design-approved token or a literal.'

/**
 * Per-network colours (26 tokens, 1 frontier occurrence total): network
 * badges resolve chain colours through hooks, not compat style props, so the
 * family is cold by measurement — the one `$chain_137` call site converts to
 * a literal or a `network-*` utility.
 */
const PER_NETWORK = [
  'per-network colour; the frontier consumes chain colours through hooks (1 occurrence of the whole family on',
  '2,080 files), so it stays out of the closed map — use a literal or the network-* utilities.',
].join(' ')

/** Tamagui-internal component aliases with zero frontier occurrences. */
const COLD_TAMAGUI_ALIAS =
  'Tamagui-internal component alias with zero occurrences on the migration frontier; widen on demand.'

/** Zero frontier occurrences; the partition gate makes widening a one-line decision later. */
const COLD = 'zero occurrences on the migration frontier; widen on demand.'

/**
 * Every `ui/src` theme colour token the compat compilers reject, with the
 * reason. Keys are the `$`-prefixed spellings a legacy call site uses.
 */
export const REJECTED_COLOR_TOKENS: Readonly<Record<string, string>> = {
  $accent3: DEPRECATED_REPOINTED,
  $accent3Hovered: DEPRECATED_REPOINTED,
  $DEP_accentBranded: DEPRECATED_PALETTE,
  $DEP_accentSoft: DEPRECATED_PALETTE,
  $DEP_backgroundBranded: DEPRECATED_PALETTE,
  $DEP_backgroundOverlay: DEPRECATED_PALETTE,
  $DEP_blue400: DEPRECATED_PALETTE,
  $DEP_brandedAccentSoft: DEPRECATED_PALETTE,
  $DEP_fiatBanner: DEPRECATED_PALETTE,
  $DEP_magentaDark: DEPRECATED_PALETTE,
  $DEP_shadowBranded: DEPRECATED_PALETTE,
  $chain_1: PER_NETWORK,
  $chain_10: PER_NETWORK,
  $chain_10143: PER_NETWORK,
  $chain_11155111: PER_NETWORK,
  $chain_130: PER_NETWORK,
  $chain_1301: PER_NETWORK,
  $chain_137: PER_NETWORK,
  $chain_143: PER_NETWORK,
  $chain_1868: PER_NETWORK,
  $chain_196: PER_NETWORK,
  $chain_324: PER_NETWORK,
  $chain_42161: PER_NETWORK,
  $chain_4217: PER_NETWORK,
  $chain_42220: PER_NETWORK,
  $chain_43114: PER_NETWORK,
  $chain_4326: PER_NETWORK,
  $chain_4663: PER_NETWORK,
  $chain_480: PER_NETWORK,
  $chain_501000101: PER_NETWORK,
  $chain_5042: PER_NETWORK,
  $chain_56: PER_NETWORK,
  $chain_57073: PER_NETWORK,
  $chain_59144: PER_NETWORK,
  $chain_7777777: PER_NETWORK,
  $chain_80001: PER_NETWORK,
  $chain_8453: PER_NETWORK,
  $backgroundFocus: COLD_TAMAGUI_ALIAS,
  $backgroundHover: COLD_TAMAGUI_ALIAS,
  $backgroundPress: COLD_TAMAGUI_ALIAS,
  $borderColor: COLD_TAMAGUI_ALIAS,
  $borderColorFocus: COLD_TAMAGUI_ALIAS,
  $borderColorHover: COLD_TAMAGUI_ALIAS,
  $colorFocus: COLD_TAMAGUI_ALIAS,
  $colorHover: COLD_TAMAGUI_ALIAS,
  $colorPress: COLD_TAMAGUI_ALIAS,
  $outlineColor: COLD_TAMAGUI_ALIAS,
  $pinkThemed: COLD,
  $statusCritical2Hovered: COLD,
  $statusSuccess2Hovered: COLD,
  $statusWarning2Hovered: COLD,
  // Contrast tokens (each theme carries the opposite theme's base value, added
  // for ui/src Coachmark's portalled inverse look — INFRA-3506 item 4).
  $neutral1Contrast: COLD,
  $surface1Contrast: COLD,
  $surface3Contrast: COLD,
}
