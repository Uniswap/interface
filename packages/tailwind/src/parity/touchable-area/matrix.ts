/**
 * The enumerated TouchableArea parity matrix: the interactive frame surface
 * (variants, hoverable/focusable gating, press scale/opacity, disabled,
 * hitSlop) crossed with representative values, plus the interaction-relevant
 * layout/visual pools, pseudo-state pools, responsive media, platform/theme
 * overrides, group states, animation presets, and the modifier-press surface.
 *
 * Remaining exclusions are runtime-behavioral, not prop-pool omissions —
 * see `exclusions.ts` for the explicit ledger.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { TouchableAreaCompatProps } from '../../../../mycelium/src/touchable-area/compile'
import type { ThemeName } from '../core/theme'

export interface MatrixCase {
  name: string
  props: TouchableAreaCompatProps
  theme: ThemeName
}

/** A titled slice of the matrix — the parity workbench page renders one comparison grid per section. */
export interface MatrixSection {
  title: string
  cases: MatrixCase[]
}

const VARIANTS = ['unstyled', 'none', 'outlined', 'filled', 'floating'] as const

function caseOf(name: string, props: TouchableAreaCompatProps): MatrixCase {
  return { name, props, theme: 'light' }
}

function darkCaseOf(name: string, props: TouchableAreaCompatProps): MatrixCase {
  return { name, props, theme: 'dark' }
}

function variantCases(): MatrixCase[] {
  const cases: MatrixCase[] = [caseOf('default (no props)', {}), darkCaseOf('default (no props, dark)', {})]
  for (const variant of VARIANTS) {
    cases.push(caseOf(`variant=${variant}`, { variant }), darkCaseOf(`variant=${variant} (dark)`, { variant }))
  }
  cases.push(
    caseOf('variant=raised bg $surface1', { variant: 'raised', backgroundColor: '$surface1' }),
    darkCaseOf('variant=raised bg $surface1 (dark)', { variant: 'raised', backgroundColor: '$surface1' }),
    caseOf('variant=raised bg $surface2', { variant: 'raised', backgroundColor: '$surface2' }),
    caseOf('variant=raised bg raw hex', { variant: 'raised', backgroundColor: '#ffffff' }),
    caseOf('variant=filled bg override', { variant: 'filled', backgroundColor: '$accent2' }),
    caseOf('variant=outlined radius override', { variant: 'outlined', borderRadius: '$rounded24' }),
  )
  return cases
}

function hoverableCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const variant of ['none', 'outlined', 'filled', 'floating'] as const) {
    cases.push(caseOf(`hoverable=false variant=${variant}`, { hoverable: false, variant }))
  }
  cases.push(
    caseOf('hoverable=false variant=raised', { hoverable: false, variant: 'raised', backgroundColor: '$surface1' }),
    caseOf('hoverable=true explicit variant=none', { hoverable: true, variant: 'none' }),
    caseOf('hoverable=false + user hoverStyle', { hoverable: false, hoverStyle: { backgroundColor: '$surface2' } }),
    darkCaseOf('hoverable=false variant=filled (dark)', { hoverable: false, variant: 'filled' }),
  )
  return cases
}

function pressCases(): MatrixCase[] {
  return [
    caseOf('scaleTo=0.9', { scaleTo: 0.9 }),
    caseOf('scaleTo=0.98', { scaleTo: 0.98 }),
    caseOf('scaleTo=1.05', { scaleTo: 1.05 }),
    caseOf('activeOpacity=0.5', { activeOpacity: 0.5 }),
    caseOf('activeOpacity=1', { activeOpacity: 1 }),
    caseOf('activeOpacity=0', { activeOpacity: 0 }),
    caseOf('scaleTo=0 (ignored like legacy)', { scaleTo: 0 }),
    caseOf('scaleTo+activeOpacity', { scaleTo: 0.95, activeOpacity: 0.6 }),
    caseOf('pressStyle bg token', { pressStyle: { backgroundColor: '$surface3' } }),
    caseOf('pressStyle bg raw', { pressStyle: { backgroundColor: '#123456' } }),
    darkCaseOf('pressStyle bg token (dark)', { pressStyle: { backgroundColor: '$surface3' } }),
    caseOf('pressStyle scale override', { pressStyle: { scale: 0.9 } }),
    caseOf('pressStyle opacity override', { pressStyle: { opacity: 0.4 } }),
    caseOf('pressStyle translate', { pressStyle: { y: 1 } }),
    caseOf('pressStyle combo', { pressStyle: { backgroundColor: '$surface2', scale: 0.96, opacity: 0.9 } }),
    caseOf('scaleTo + pressStyle scale conflict', { scaleTo: 0.9, pressStyle: { scale: 0.8 } }),
    caseOf('scaleTo + pressStyle bg', { scaleTo: 0.92, pressStyle: { backgroundColor: '$surface3' } }),
    caseOf('variant=filled + pressStyle bg', { variant: 'filled', pressStyle: { backgroundColor: '$surface1' } }),
  ]
}

function focusCases(): MatrixCase[] {
  return [
    caseOf('focusable=false', { focusable: false }),
    caseOf('focusable=false variant=filled', { focusable: false, variant: 'filled' }),
    darkCaseOf('focusable=false (dark)', { focusable: false }),
    caseOf('focusVisibleStyle bg token', { focusVisibleStyle: { backgroundColor: '$surface3' } }),
    caseOf('focusVisibleStyle outline raw', {
      focusVisibleStyle: { outlineColor: '#ff37c7', outlineWidth: 2, outlineStyle: 'solid' },
    }),
    caseOf('focusVisibleStyle scale override', { focusVisibleStyle: { scaleX: 1, scaleY: 1 } }),
    caseOf('focusStyle border', { focusStyle: { borderColor: '$accent1', borderWidth: 1 } }),
    caseOf('focusStyle bg', { focusStyle: { backgroundColor: '$surface2' } }),
    caseOf('focusWithinStyle bg', { focusWithinStyle: { backgroundColor: '$surface2' } }),
  ]
}

function disabledCases(): MatrixCase[] {
  const cases: MatrixCase[] = [
    caseOf('disabled', { disabled: true }),
    darkCaseOf('disabled (dark)', { disabled: true }),
  ]
  for (const variant of VARIANTS) {
    cases.push(caseOf(`disabled variant=${variant}`, { disabled: true, variant }))
  }
  cases.push(
    darkCaseOf('disabled variant=filled (dark)', { disabled: true, variant: 'filled' }),
    caseOf('disabled variant=raised bg $surface1', {
      disabled: true,
      variant: 'raised',
      backgroundColor: '$surface1',
    }),
    caseOf('disabled + user pressStyle', { disabled: true, pressStyle: { backgroundColor: '$surface3' } }),
    caseOf('disabled + user bg', { disabled: true, backgroundColor: '$accent2' }),
    caseOf('disabledStyle opacity', { disabledStyle: { opacity: 0.4 } }),
    caseOf('disabledStyle bg token', { disabledStyle: { backgroundColor: '$surface2' } }),
    caseOf('disabled + disabledStyle combo', { disabled: true, disabledStyle: { opacity: 0.5 } }),
  )
  return cases
}

function hitSlopCases(): MatrixCase[] {
  return [
    caseOf('hitSlop number', { hitSlop: 20 }),
    caseOf('hitSlop insets', { hitSlop: { top: 8, right: 4, bottom: 8, left: 4 } }),
    caseOf('hitSlop null', { hitSlop: null }),
    caseOf('shouldConsiderMinimumDimensions', { shouldConsiderMinimumDimensions: true }),
  ]
}

function layoutCases(): MatrixCase[] {
  const cases: MatrixCase[] = [
    caseOf('row', { row: true }),
    caseOf('row=false', { row: false }),
    caseOf('centered', { centered: true }),
    caseOf('row+centered', { row: true, centered: true }),
    caseOf('row+centered+gap', { row: true, centered: true, gap: '$gap8' }),
  ]
  for (const v of ['row', 'column', 'row-reverse', 'column-reverse'] as const) {
    cases.push(caseOf(`flexDirection=${v}`, { flexDirection: v }))
  }
  for (const v of ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] as const) {
    cases.push(caseOf(`alignItems=${v}`, { alignItems: v }))
  }
  for (const v of ['flex-start', 'flex-end', 'center', 'space-between'] as const) {
    cases.push(caseOf(`justifyContent=${v}`, { justifyContent: v }))
  }
  cases.push(
    caseOf('alignSelf=center', { alignSelf: 'center' }),
    caseOf('flexWrap=wrap', { flexWrap: 'wrap' }),
    caseOf('flex=1', { flex: 1 }),
    caseOf('flexGrow=1', { flexGrow: 1 }),
    caseOf('flexShrink=1', { flexShrink: 1 }),
    caseOf('flexBasis=0', { flexBasis: 0 }),
    caseOf('display=none', { display: 'none' }),
    caseOf('display=inline-flex', { display: 'inline-flex' }),
    caseOf('gap token', { gap: '$spacing12' }),
    caseOf('gap number', { gap: 7 }),
    caseOf('rowGap+columnGap', { rowGap: '$spacing8', columnGap: '$spacing16' }),
    caseOf('p token', { p: '$spacing16' }),
    caseOf('px+py', { px: '$spacing12', py: '$spacing8' }),
    caseOf('m negative', { mt: -8 }),
    caseOf('width number', { width: 100 }),
    caseOf('width percent', { width: '100%' }),
    caseOf('width max-content', { width: 'max-content' }),
    caseOf('height number', { height: 48 }),
    caseOf('minWidth+minHeight', { minWidth: 24, minHeight: 24 }),
    caseOf('maxWidth', { maxWidth: 320 }),
    caseOf('position absolute + edges', { position: 'absolute', top: 0, right: 4 }),
    caseOf('zIndex', { zIndex: 5 }),
  )
  return cases
}

function visualCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const theme of ['light', 'dark'] as const) {
    const themedCaseOf = theme === 'dark' ? darkCaseOf : caseOf
    for (const token of [
      '$surface1',
      '$surface2',
      '$surface3',
      '$surface4',
      '$surface5',
      '$accent1',
      '$accent2',
      '$statusWarning',
      '$transparent',
    ] as const) {
      cases.push(themedCaseOf(`backgroundColor=${token} (${theme})`, { backgroundColor: token }))
    }
  }
  cases.push(
    caseOf('backgroundColor raw hex', { backgroundColor: '#123456' }),
    caseOf('backgroundColor raw rgba', { backgroundColor: 'rgba(19,19,19,0.5)' }),
    caseOf('borderColor+width', { borderColor: '$surface3', borderWidth: 1 }),
    caseOf('borderColor raw', { borderColor: '#ff0000', borderWidth: 2 }),
    caseOf('borderRadius=$rounded16', { borderRadius: '$rounded16' }),
    caseOf('borderRadius=$roundedFull', { borderRadius: '$roundedFull' }),
    caseOf('borderRadius number', { borderRadius: 10 }),
    caseOf('borderRadius=$none', { borderRadius: '$none' }),
    caseOf('opacity=0.5', { opacity: 0.5 }),
    caseOf('overflow=hidden', { overflow: 'hidden' }),
  )
  return cases
}

function hoverCases(): MatrixCase[] {
  const cases: MatrixCase[] = [
    caseOf('hoverStyle bg token', { hoverStyle: { backgroundColor: '$surface2' } }),
    caseOf('hoverStyle bg raw', { hoverStyle: { backgroundColor: '#123456' } }),
    caseOf('hoverStyle opacity', { hoverStyle: { opacity: 0.8 } }),
    caseOf('hoverStyle border', { hoverStyle: { borderColor: '$accent1', borderWidth: 1 } }),
    caseOf('hoverStyle + variant=none', { variant: 'none', hoverStyle: { opacity: 0.9 } }),
    caseOf('hoverStyle + variant=outlined', { variant: 'outlined', hoverStyle: { backgroundColor: '$surface1' } }),
    caseOf('hoverStyle + variant=filled', { variant: 'filled', hoverStyle: { opacity: 0.9 } }),
    caseOf('hover+press together', {
      hoverStyle: { backgroundColor: '$surface2' },
      pressStyle: { backgroundColor: '$surface3' },
    }),
  ]
  for (const theme of ['light', 'dark'] as const) {
    const themedCaseOf = theme === 'dark' ? darkCaseOf : caseOf
    for (const token of ['$surface1Hovered', '$surface2Hovered', '$surface3Hovered', '$surface5Hovered'] as const) {
      cases.push(themedCaseOf(`hoverStyle bg ${token} (${theme})`, { hoverStyle: { backgroundColor: token } }))
    }
  }
  return cases
}

const MEDIA_KEYS = [
  '$xxs',
  '$xs',
  '$sm',
  '$md',
  '$lg',
  '$xl',
  '$xxl',
  '$xxxl',
  '$short',
  '$midHeight',
  '$lgHeight',
] as const

function responsiveCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const key of MEDIA_KEYS) {
    cases.push(caseOf(`${key} spacing`, { [key]: { gap: '$gap8', p: '$spacing12' } } as TouchableAreaCompatProps))
  }
  cases.push(
    caseOf('$sm direction', { $sm: { flexDirection: 'row' } }),
    caseOf('$sm hidden', { $sm: { display: 'none' } }),
    caseOf('$sm+$md same property', { $sm: { gap: 4 }, $md: { gap: 8 } }),
    caseOf('$sm width + base width', { width: 200, $sm: { width: '100%' } }),
    caseOf('$sm nested hoverStyle', { $sm: { hoverStyle: { backgroundColor: '$surface2' } } }),
  )
  return cases
}

function platformThemeCases(): MatrixCase[] {
  return [
    caseOf('$platform-web width', { '$platform-web': { width: 'max-content' } }),
    caseOf('$platform-web cursor', { '$platform-web': { cursor: 'grab' } }),
    caseOf('$platform-web overrides base', { width: 100, '$platform-web': { width: 200 } }),
    caseOf('$platform-native ignored', { '$platform-native': { width: 123 } } as TouchableAreaCompatProps),
    caseOf('$theme-dark bg raw', { '$theme-dark': { backgroundColor: '#0a0a0a' } }),
    darkCaseOf('$theme-dark bg token (dark)', { '$theme-dark': { backgroundColor: '$surface2' } }),
    caseOf('$theme-light bg token (light)', { '$theme-light': { backgroundColor: '$surface3' } }),
    caseOf('$theme-dark + $theme-light together', {
      '$theme-dark': { opacity: 0.9 },
      '$theme-light': { opacity: 0.6 },
    }),
  ]
}

function groupCases(): MatrixCase[] {
  // Group-state pools stick to opacity/scale declarations: the legacy frame is
  // itself a group ('true'), so group props resolve against the runtime group
  // context and the standalone extraction pins per-scope literals (see
  // expectations.ts). Color compilation inside group pools is the shared
  // compat-core path, proven by the Flex binding of this suite.
  return [
    caseOf('group container named', { group: 'item' }),
    caseOf('$group-hover opacity', { '$group-hover': { opacity: 0.5 } }),
    caseOf('$group-item-hover opacity', { '$group-item-hover': { opacity: 0.7 } }),
    caseOf('$group-item-press scale', { '$group-item-press': { scale: 0.98 } }),
  ]
}

function modifierPressCases(): MatrixCase[] {
  return [
    caseOf('modifierPressHref', { modifierPressHref: 'https://app.uniswap.org' }),
    caseOf('modifierPressHref + variant=outlined', {
      modifierPressHref: 'https://app.uniswap.org',
      variant: 'outlined',
    }),
  ]
}

function animationCases(): MatrixCase[] {
  // The legacy TouchableArea has no animateEnter/animateExit preset surface
  // (those are Flex styled-variants) — the accepted-and-ignored runtime
  // `animation` driver props are proven inert on the CSS surface instead.
  return [
    caseOf('animation=null', { animation: null }),
    caseOf('animateOnly accepted', { animation: null, animateOnly: ['transform', 'opacity'] }),
  ]
}

function longTailCases(): MatrixCase[] {
  return [
    caseOf('cursor override', { cursor: 'grab' }),
    caseOf('userSelect none', { userSelect: 'none' }),
    caseOf('pointerEvents none', { pointerEvents: 'none' }),
    caseOf('translate x+y', { x: 10, y: -5 }),
    caseOf('scale style prop', { scale: 0.9 }),
    caseOf('rotate', { rotate: '45deg' }),
    caseOf('transformOrigin', { x: 4, transformOrigin: 'top left' }),
    caseOf('shadow full', {
      shadowColor: '$black',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    caseOf('aspectRatio', { aspectRatio: 1 }),
    caseOf('borderStyle dashed', { borderStyle: 'dashed', borderWidth: 1 }),
    caseOf('transition raw', { transition: 'opacity 0.2s ease' }),
    caseOf('touchAction none', { touchAction: 'none' }),
  ]
}

function compositeCases(): MatrixCase[] {
  return [
    caseOf('icon button combo', {
      centered: true,
      p: '$spacing8',
      borderRadius: '$roundedFull',
      hoverStyle: { backgroundColor: '$surface2' },
    }),
    caseOf('list row combo', {
      row: true,
      gap: '$gap12',
      px: '$spacing16',
      py: '$spacing12',
      hoverStyle: { backgroundColor: '$surface2' },
      pressStyle: { backgroundColor: '$surface3' },
    }),
    caseOf('pill combo', {
      variant: 'filled',
      row: true,
      centered: true,
      gap: 4,
      px: 12,
      height: 32,
      borderRadius: '$roundedFull',
    }),
    darkCaseOf('card combo (dark)', {
      variant: 'outlined',
      p: '$spacing16',
      borderRadius: '$rounded16',
      scaleTo: 0.98,
    }),
  ]
}

export function buildMatrixSections(): MatrixSection[] {
  return [
    { title: 'Variants', cases: variantCases() },
    { title: 'Hoverable gating', cases: hoverableCases() },
    { title: 'Press surface', cases: pressCases() },
    { title: 'Focus surface', cases: focusCases() },
    { title: 'Disabled', cases: disabledCases() },
    { title: 'Hit slop & minimum dimensions', cases: hitSlopCases() },
    { title: 'Layout', cases: layoutCases() },
    { title: 'Colors, borders & visuals', cases: visualCases() },
    { title: 'Hover styles', cases: hoverCases() },
    { title: 'Responsive media', cases: responsiveCases() },
    { title: 'Platform & theme overrides', cases: platformThemeCases() },
    { title: 'Group states', cases: groupCases() },
    { title: 'Modifier press', cases: modifierPressCases() },
    { title: 'Animation props (accepted-and-ignored)', cases: animationCases() },
    { title: 'Long-tail styles', cases: longTailCases() },
    { title: 'Composites', cases: compositeCases() },
  ]
}

export function buildMatrix(): MatrixCase[] {
  return buildMatrixSections().flatMap((section) => section.cases)
}
