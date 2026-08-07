/**
 * Per-case expected (pinned, never-silent) diffs for the menu-family parity
 * matrices. Two sources, mirroring the flex expectations:
 *  - palette drift: semantic color tokens whose values differ between the two
 *    token systems, applied from the case's own effective style object;
 *  - structural pins: documented one-sided declarations (animation preset
 *    declarations on the Tailwind side; Tamagui runtime plumbing on the
 *    legacy side), each tied to an exclusions-ledger entry.
 */
import type { DeclarationDiff } from '../core/diff'
import { expectedDrift } from '../core/palette-drift'
import { BASE_SCOPE } from '../core/scope'
import type { ThemeName } from '../core/theme'
import type { ContainerMatrixProps, ItemFrameMatrixProps, ItemLabelMatrixProps, SeparatorMatrixProps } from './matrix'

/** Returns a scope-merger bound to one case's output map (flex-expectations shape). */
function scopedMerger(out: Map<string, DeclarationDiff>): (scope: string, diff: DeclarationDiff) => void {
  return (scope, diff) => {
    if (Object.keys(diff).length > 0) {
      out.set(scope, { ...out.get(scope), ...diff })
    }
  }
}

/**
 * The legacy MenuContent container defaults
 * (`uniswap/src/components/menus/ContextMenuContent.tsx`), relevant here for
 * which color tokens are in play before containerStyles overrides.
 */
const CONTAINER_DEFAULT_COLORS = { backgroundColor: '$surface1', borderColor: '$surface3' }

/** Post-normalization `animation` declaration for the fadeIn preset (see flex expectations). */
const FADE_IN_ANIMATION_DECLARATION = 'spore-enter-fade-in 200ms ease-out'

export function expectedContainerDiffs(props: ContainerMatrixProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const merge = scopedMerger(out)
  const effective = { ...CONTAINER_DEFAULT_COLORS, ...props }
  merge(
    BASE_SCOPE,
    expectedDrift(
      { backgroundColor: effective.backgroundColor as string, borderColor: effective.borderColor as string },
      theme,
    ),
  )
  // Structural pin: enter presets add a base `animation` declaration on the
  // Tailwind side only (Tamagui timing lives in its runtime driver).
  if (props.animateEnter === 'fadeIn') {
    merge(BASE_SCOPE, { animation: { tailwind: FADE_IN_ANIMATION_DECLARATION } })
  }
  // Structural pin: an explicit `minWidth: undefined` (the sheet container
  // styles neutralising the 200px default) makes Tamagui drop its RN
  // `min-width: 0` reset entirely; the compat keeps the reset class. A 0px
  // min-width on a stretch-width card is visually inert.
  if (Object.hasOwn(props, 'minWidth') && props.minWidth === undefined) {
    merge(BASE_SCOPE, { 'min-width': { tailwind: '0px' } })
  }
  return out
}

/**
 * The @universe/tailwind surface1-hovered values. Since the token
 * reconciliation (#35388) these MATCH the Tamagui palette — the hover entry
 * below stays pinned only because it is one-sided: the legacy TouchableArea
 * drives hover by swapping inline styles at runtime, so the CSSOM extraction
 * has no tamagui-side hover declaration to compare against.
 */
const SURFACE1_HOVERED_TAILWIND: Record<ThemeName, string> = {
  light: 'rgba(252,252,252,1)',
  dark: 'rgba(26,26,26,1)',
}

export function expectedItemFrameDiffs(props: ItemFrameMatrixProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const merge = scopedMerger(out)
  // The legacy frame is a TouchableArea — an ANIMATED Tamagui component that
  // inlines all styles and drives hover/press by swapping inline styles at
  // runtime, so the CSSOM extraction sees base-scope declarations only.
  // Structural pins, each tied to the exclusions ledger:
  //  - group container declarations (same pin as the flex suite);
  //  - the animation-driver baseline for animatable props at rest (opacity 1
  //    and the identity transform, which jsdom serializes as an object) plus
  //    the focus outline reset;
  //  - the compat expresses hover as CSS, so its hover declaration is
  //    one-sided here (the legacy hover value itself is $surface1Hovered,
  //    whose cross-system drift is the pinned palette-drift entry).
  merge(BASE_SCOPE, {
    'container-name': { tamagui: 'true' },
    'container-type': { tamagui: 'inline-size' },
    'outline-color': { tamagui: 'rgba(0,0,0,0)' },
    transform: { tamagui: '[object object]' },
  })
  if (props.disabled === true) {
    // Disabled dims to 0.6 + pointer-events none on BOTH sides (the compat
    // mirrors TouchableArea's disabled styling), so no diff remains there.
  } else {
    // At-rest animation-driver baseline the compat doesn't need (opacity: 1
    // equals the CSS default).
    merge(BASE_SCOPE, { opacity: { tamagui: '1' } })
    merge('hover', { 'background-color': { tailwind: SURFACE1_HOVERED_TAILWIND[theme] } })
  }
  return out
}

export function expectedItemLabelDiffs(props: ItemLabelMatrixProps, _theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const merge = scopedMerger(out)
  // The label compiles through text-compat, whose generated `--stext-*` vars
  // pin the TAMAGUI palette values exactly — no color drift is expected.
  //
  // Structural pin (float formatting, same value): buttonLabel3's line-height
  // is 14px × 1.15 — Tamagui emits the raw IEEE-754 product
  // (16.099999999999998px) while the text-compat metrics pin the decimal
  // (16.1px). Browsers resolve both to the identical used value.
  if (props.variant === 'small') {
    merge(BASE_SCOPE, {
      'line-height': { tamagui: '16.099999999999998px', tailwind: '16.1px' },
    })
  }
  return out
}

/**
 * Structural pins for the menu separator (see the 'Menu separator geometry'
 * ledger entry): the legacy `<Separator my="$spacing6" />` is a Tamagui
 * Stack — a 0-height flex:1 line (with the RN resets) carrying only a bottom
 * border — while the compat renders a plain full-width div with the same
 * margins and bottom border. Inside the column menu card both paint the
 * identical 1px line; these box-model declarations are the whole delta.
 */
const SEPARATOR_GEOMETRY_PINS: DeclarationDiff = {
  'align-items': { tamagui: 'stretch' },
  'border-left-style': { tamagui: 'solid' },
  'border-left-width': { tamagui: '0px' },
  'border-right-style': { tamagui: 'solid' },
  'border-right-width': { tamagui: '0px' },
  'border-top-style': { tamagui: 'solid' },
  'border-top-width': { tamagui: '0px' },
  'box-sizing': { tamagui: 'border-box' },
  display: { tamagui: 'flex' },
  'flex-basis': { tamagui: 'auto' },
  'flex-direction': { tamagui: 'column' },
  'flex-grow': { tamagui: '1' },
  'flex-shrink': { tamagui: '1' },
  height: { tamagui: '0px' },
  'max-height': { tamagui: '0px' },
  'min-height': { tamagui: '0px' },
  'min-width': { tamagui: '0px' },
  position: { tamagui: 'relative' },
  width: { tailwind: '100%' },
}

/**
 * Menu separator (`<Separator my="$spacing6" />` vs the compat divider):
 * palette drift on `$surface3` plus the pinned geometry deltas documented in
 * the 'Menu separator geometry' ledger entry.
 */
export function expectedSeparatorDiffs(_props: SeparatorMatrixProps, theme: ThemeName): Map<string, DeclarationDiff> {
  const out = new Map<string, DeclarationDiff>()
  const merge = scopedMerger(out)
  merge(BASE_SCOPE, expectedDrift({ borderColor: '$surface3' }, theme))
  merge(BASE_SCOPE, SEPARATOR_GEOMETRY_PINS)
  return out
}
