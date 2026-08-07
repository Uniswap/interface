/**
 * The enumerated parity matrix: every supported Flex prop pool crossed with
 * representative values (spore tokens, raw numbers, percentages) plus
 * realistic variant combinations — base styles, pseudo states, responsive
 * media, platform overrides, group states, animation presets, and the
 * long-tail arbitrary-value surface.
 *
 * Remaining exclusions are runtime-behavioral, not prop-pool omissions —
 * see `exclusions.ts` for the explicit ledger.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { FlexCompatProps } from '../../../../mycelium/src/flex-compat/compile'
import type { ThemeName } from '../core/theme'

export interface MatrixCase {
  name: string
  props: FlexCompatProps
  theme: ThemeName
}

/** A titled slice of the matrix — the parity workbench page renders one comparison grid per section. */
export interface MatrixSection {
  title: string
  cases: MatrixCase[]
}

const SPACE_VALUES = ['$spacing12', '$gap8', 7, 0] as const
const COLOR_TOKENS = [
  '$white',
  '$black',
  '$transparent',
  '$neutral1',
  '$neutral2',
  '$neutral3',
  '$surface1',
  '$surface2',
  '$surface3',
  '$surface4',
  '$surface5',
  '$accent1',
  '$accent2',
  '$statusSuccess',
  '$statusCritical',
  '$statusWarning',
] as const
const RADIUS_TOKENS = [
  '$none',
  '$rounded4',
  '$rounded6',
  '$rounded8',
  '$rounded12',
  '$rounded16',
  '$rounded20',
  '$rounded24',
  '$rounded32',
  '$roundedFull',
] as const

function caseOf(name: string, props: FlexCompatProps): MatrixCase {
  return { name, props, theme: 'light' }
}

function darkCaseOf(name: string, props: FlexCompatProps): MatrixCase {
  return { name, props, theme: 'dark' }
}

function variantCases(): MatrixCase[] {
  return [
    caseOf('base (no props)', {}),
    caseOf('row', { row: true }),
    caseOf('row=false', { row: false }),
    caseOf('shrink', { shrink: true }),
    caseOf('grow', { grow: true }),
    caseOf('fill', { fill: true }),
    caseOf('centered', { centered: true }),
    caseOf('maxContent', { maxContent: true }),
    caseOf('inset number', { inset: 8 }),
    caseOf('inset token', { inset: '$spacing16' }),
    caseOf('inset object', { inset: { top: 1, right: 2, bottom: 3, left: 4 } }),
    caseOf('row+centered', { row: true, centered: true }),
    caseOf('row+centered+gap', { row: true, centered: true, gap: '$gap12' }),
    caseOf('fill+row', { fill: true, row: true }),
    caseOf('grow+shrink', { grow: true, shrink: true }),
  ]
}

function flexboxEnumCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const v of ['row', 'column', 'row-reverse', 'column-reverse'] as const) {
    cases.push(caseOf(`flexDirection=${v}`, { flexDirection: v }))
  }
  for (const v of ['stretch', 'flex-start', 'flex-end', 'center', 'baseline'] as const) {
    cases.push(caseOf(`alignItems=${v}`, { alignItems: v }))
  }
  for (const v of ['auto', 'stretch', 'flex-start', 'flex-end', 'center', 'baseline'] as const) {
    cases.push(caseOf(`alignSelf=${v}`, { alignSelf: v }))
  }
  for (const v of ['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly'] as const) {
    cases.push(caseOf(`justifyContent=${v}`, { justifyContent: v }))
  }
  for (const v of ['nowrap', 'wrap', 'wrap-reverse'] as const) {
    cases.push(caseOf(`flexWrap=${v}`, { flexWrap: v }))
  }
  for (const v of ['flex', 'none', 'inline-flex'] as const) {
    cases.push(caseOf(`display=${v}`, { display: v }))
  }
  return cases
}

function flexNumericCases(): MatrixCase[] {
  return [
    caseOf('flex=1', { flex: 1 }),
    caseOf('flex=2', { flex: 2 }),
    caseOf('flexGrow=0', { flexGrow: 0 }),
    caseOf('flexGrow=2', { flexGrow: 2 }),
    caseOf('flexShrink=0', { flexShrink: 0 }),
    caseOf('flexShrink=2', { flexShrink: 2 }),
    caseOf('flexBasis=0', { flexBasis: 0 }),
    caseOf('flexBasis=100', { flexBasis: 100 }),
    caseOf('flexBasis=50%', { flexBasis: '50%' }),
    caseOf('flexBasis=auto', { flexBasis: 'auto' }),
  ]
}

function gapCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const v of SPACE_VALUES) {
    cases.push(
      caseOf(`gap=${String(v)}`, { gap: v }),
      caseOf(`rowGap=${String(v)}`, { rowGap: v }),
      caseOf(`columnGap=${String(v)}`, { columnGap: v }),
    )
  }
  cases.push(caseOf('gap+rowGap override', { gap: '$gap8', rowGap: '$spacing24' }))
  return cases
}

function spacingCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  const spacingProps = ['m', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr'] as const
  for (const prop of spacingProps) {
    for (const v of SPACE_VALUES) {
      cases.push(caseOf(`${prop}=${String(v)}`, { [prop]: v } as FlexCompatProps))
    }
  }
  cases.push(
    caseOf('negative mt', { mt: -8 }),
    caseOf('negative mx', { mx: -4 }),
    caseOf('p overridden by px+pt', { p: '$spacing16', px: '$spacing8', pt: 2 }),
  )
  return cases
}

function sizingCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const [prop, values] of [
    ['width', [100, 0, '100%', 'max-content']],
    ['height', [48, '100%', 'auto']],
    ['minWidth', [10, '50%']],
    ['minHeight', [24, '100%']],
    ['maxWidth', [320, '100%']],
    ['maxHeight', [200, '75%']],
  ] as const) {
    for (const v of values) {
      cases.push(caseOf(`${prop}=${String(v)}`, { [prop]: v } as FlexCompatProps))
    }
  }
  return cases
}

function colorCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  // Both themes — value drift between the two token systems is theme-dependent.
  for (const theme of ['light', 'dark'] as const) {
    const themedCaseOf = theme === 'dark' ? darkCaseOf : caseOf
    for (const token of COLOR_TOKENS) {
      cases.push(themedCaseOf(`backgroundColor=${token} (${theme})`, { backgroundColor: token }))
    }
    cases.push(
      themedCaseOf(`backgroundColor raw hex (${theme})`, { backgroundColor: '#123456' }),
      themedCaseOf(`backgroundColor raw rgba (${theme})`, { backgroundColor: 'rgba(19,19,19,0.5)' }),
      themedCaseOf(`borderColor=$surface3+width (${theme})`, { borderColor: '$surface3', borderWidth: 1 }),
      themedCaseOf(`borderColor=$neutral2+width (${theme})`, { borderColor: '$neutral2', borderWidth: 2 }),
      themedCaseOf(`borderColor raw (${theme})`, { borderColor: '#ff0000', borderWidth: 3 }),
    )
  }
  return cases
}

function visualCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  for (const token of RADIUS_TOKENS) {
    cases.push(caseOf(`borderRadius=${token}`, { borderRadius: token }))
  }
  cases.push(
    caseOf('borderRadius=10', { borderRadius: 10 }),
    caseOf('borderWidth only', { borderWidth: 1 }),
    caseOf('opacity=0.5', { opacity: 0.5 }),
    caseOf('opacity=0', { opacity: 0 }),
    caseOf('overflow=hidden', { overflow: 'hidden' }),
    caseOf('overflow=visible', { overflow: 'visible' }),
    caseOf('overflow=scroll', { overflow: 'scroll' }),
  )
  return cases
}

function positionCases(): MatrixCase[] {
  return [
    caseOf('position=absolute', { position: 'absolute' }),
    caseOf('position=relative', { position: 'relative' }),
    caseOf('absolute+edges tokens', { position: 'absolute', top: '$spacing4', left: '$spacing8' }),
    caseOf('absolute+edges numbers', { position: 'absolute', top: 0, right: 4, bottom: 8, left: 12 }),
    caseOf('zIndex=5', { zIndex: 5 }),
    caseOf('zIndex=0', { zIndex: 0 }),
  ]
}

function compositeCases(): MatrixCase[] {
  return [
    caseOf('card combo', {
      row: true,
      gap: '$gap8',
      px: '$spacing16',
      py: '$spacing12',
      backgroundColor: '$surface2',
      borderRadius: '$rounded16',
    }),
    caseOf('centered fill panel', { centered: true, fill: true, p: '$spacing24', backgroundColor: '$surface1' }),
    caseOf('pill', {
      row: true,
      centered: true,
      gap: 4,
      px: 12,
      height: 32,
      borderRadius: '$roundedFull',
      backgroundColor: '$accent1',
    }),
    caseOf('overlay', {
      position: 'absolute',
      inset: 0,
      centered: true,
      backgroundColor: 'rgba(0,0,0,0.6)',
      zIndex: 10,
    }),
    caseOf('spacer', { grow: true, shrink: true, flexBasis: 0 }),
    caseOf('wrap grid row', { row: true, flexWrap: 'wrap', gap: '$spacing8', maxWidth: 480 }),
  ]
}

function hoverCases(): MatrixCase[] {
  const cases: MatrixCase[] = [
    caseOf('hoverStyle bg token', { hoverStyle: { backgroundColor: '$surface2' } }),
    caseOf('hoverStyle bg raw', { hoverStyle: { backgroundColor: '#123456' } }),
    caseOf('hoverStyle opacity', { hoverStyle: { opacity: 0.8 } }),
    caseOf('hoverStyle border', { hoverStyle: { borderColor: '$accent1', borderWidth: 1 } }),
    caseOf('hoverStyle combo', {
      backgroundColor: '$surface1',
      hoverStyle: { backgroundColor: '$surface3', opacity: 0.9 },
    }),
    caseOf('hoverStyle spacing', { hoverStyle: { p: '$spacing12', gap: 4 } }),
  ]
  for (const theme of ['light', 'dark'] as const) {
    const themedCaseOf = theme === 'dark' ? darkCaseOf : caseOf
    for (const token of ['$surface1Hovered', '$surface2Hovered', '$surface3Hovered'] as const) {
      cases.push(themedCaseOf(`hoverStyle bg ${token} (${theme})`, { hoverStyle: { backgroundColor: token } }))
    }
  }
  return cases
}

function pressCases(): MatrixCase[] {
  return [
    caseOf('pressStyle bg token', { pressStyle: { backgroundColor: '$surface3' } }),
    caseOf('pressStyle scale', { pressStyle: { scale: 0.98 } }),
    caseOf('pressStyle opacity', { pressStyle: { opacity: 0.7 } }),
    caseOf('pressStyle translate', { pressStyle: { y: 1 } }),
    caseOf('pressStyle combo', { pressStyle: { backgroundColor: '$surface2', scale: 0.96, opacity: 0.9 } }),
    caseOf('hover+press together', {
      hoverStyle: { backgroundColor: '$surface2' },
      pressStyle: { backgroundColor: '$surface3' },
    }),
  ]
}

function focusCases(): MatrixCase[] {
  return [
    caseOf('focusStyle border', { focusStyle: { borderColor: '$accent1', borderWidth: 1 } }),
    caseOf('focusStyle bg', { focusStyle: { backgroundColor: '$surface2' } }),
    caseOf('focusStyle outline', { focusStyle: { outlineWidth: 2, outlineStyle: 'solid', outlineColor: '#ff37c7' } }),
    caseOf('focusVisibleStyle bg', { focusVisibleStyle: { backgroundColor: '$surface3' } }),
    caseOf('focusWithinStyle bg', { focusWithinStyle: { backgroundColor: '$surface2' } }),
  ]
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
    cases.push(
      caseOf(`${key} direction`, { [key]: { flexDirection: 'row' } } as FlexCompatProps),
      caseOf(`${key} spacing`, { [key]: { gap: '$gap8', p: '$spacing12' } } as FlexCompatProps),
      caseOf(`${key} hidden`, { [key]: { display: 'none' } } as FlexCompatProps),
    )
  }
  cases.push(
    caseOf('$sm+$md same property', { $sm: { gap: 4 }, $md: { gap: 8 } }),
    caseOf('$sm width+base width', { width: 200, $sm: { width: '100%' } }),
    caseOf('$sm nested hoverStyle', { $sm: { hoverStyle: { backgroundColor: '$surface2' } } }),
  )
  return cases
}

function platformCases(): MatrixCase[] {
  return [
    caseOf('$platform-web width', { '$platform-web': { width: 'max-content' } }),
    caseOf('$platform-web spacing', { '$platform-web': { px: '$spacing8', cursor: 'pointer' } }),
    caseOf('$platform-web overrides base', { width: 100, '$platform-web': { width: 200 } }),
    caseOf('$platform-native ignored', { '$platform-native': { width: 123 } } as FlexCompatProps),
    caseOf('$platform-native ignored + web applied', {
      '$platform-web': { display: 'inline-flex' },
      '$platform-native': { display: 'none' },
    } as FlexCompatProps),
  ]
}

function groupCases(): MatrixCase[] {
  return [
    caseOf('group container', { group: true } as FlexCompatProps),
    caseOf('group container named', { group: 'item' } as FlexCompatProps),
    caseOf('$group-hover opacity', { '$group-hover': { opacity: 0.5 } }),
    caseOf('$group-hover bg', { '$group-hover': { backgroundColor: '$surface2' } }),
    caseOf('$group-item-hover bg', { '$group-item-hover': { backgroundColor: '$surface3' } }),
    caseOf('$group-item-press scale', { '$group-item-press': { scale: 0.98 } }),
    caseOf('$group-item-focusVisible opacity', { '$group-item-focusVisible': { opacity: 0.8 } }),
  ]
}

function themeCases(): MatrixCase[] {
  // Token-color cases keep the case theme matching the override's theme so
  // both sides resolve the scope's variables against the same theme table;
  // drift on those tokens is pinned per theme by the ledger.
  return [
    caseOf('$theme-dark bg raw', { '$theme-dark': { backgroundColor: '#0a0a0a' } }),
    darkCaseOf('$theme-dark bg token (dark)', { '$theme-dark': { backgroundColor: '$surface2' } }),
    caseOf('$theme-dark opacity', { '$theme-dark': { opacity: 0.8 } }),
    caseOf('$theme-dark overrides base bg', {
      backgroundColor: '$accent1',
      '$theme-dark': { backgroundColor: '#111111' },
    }),
    caseOf('$theme-light bg token (light)', { '$theme-light': { backgroundColor: '$surface3' } }),
    darkCaseOf('$theme-light bg raw (dark)', { '$theme-light': { backgroundColor: '#ffffff' } }),
    caseOf('$theme-light border', { '$theme-light': { borderColor: '#123456', borderWidth: 1 } }),
    caseOf('$theme-dark + $theme-light together', {
      '$theme-dark': { opacity: 0.9 },
      '$theme-light': { opacity: 0.6 },
    }),
  ]
}

function disabledCases(): MatrixCase[] {
  return [
    caseOf('disabled only', { disabled: true }),
    caseOf('disabledStyle opacity', { disabledStyle: { opacity: 0.4 } }),
    caseOf('disabledStyle bg token', { disabledStyle: { backgroundColor: '$surface2' } }),
    darkCaseOf('disabledStyle bg token (dark)', { disabledStyle: { backgroundColor: '$surface2' } }),
    caseOf('disabled + disabledStyle combo', {
      disabled: true,
      disabledStyle: { opacity: 0.5, backgroundColor: '$surface3' },
    }),
    caseOf('disabledStyle + hoverStyle', {
      hoverStyle: { backgroundColor: '$surface2' },
      disabledStyle: { opacity: 0.4 },
    }),
  ]
}

function animationCases(): MatrixCase[] {
  return [
    caseOf('animateEnter fadeIn', { animateEnter: 'fadeIn' }),
    caseOf('animateEnter fadeInDown', { animateEnter: 'fadeInDown' }),
    caseOf('animateExit fadeOut', { animateExit: 'fadeOut' }),
    caseOf('animateExit fadeOutUp', { animateExit: 'fadeOutUp' }),
    caseOf('animateExit fadeOutDown', { animateExit: 'fadeOutDown' }),
    caseOf('animateEnterExit fadeInDownOutUp', { animateEnterExit: 'fadeInDownOutUp' }),
    caseOf('animateEnterExit fadeInDownOutDown', { animateEnterExit: 'fadeInDownOutDown' }),
    caseOf('animateEnterExit fadeInOut', { animateEnterExit: 'fadeInOut' }),
  ]
}

function longTailCases(): MatrixCase[] {
  return [
    caseOf('translate x', { x: 10 }),
    caseOf('translate y', { y: -5 }),
    caseOf('scale', { scale: 0.9 }),
    caseOf('rotate', { rotate: '45deg' }),
    caseOf('combined transforms', { x: 10, y: -5, scale: 0.9, rotate: '45deg' }),
    caseOf('transformOrigin', { x: 4, transformOrigin: 'top left' }),
    caseOf('shadow full', {
      shadowColor: '$black',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
    }),
    caseOf('shadow without opacity', {
      shadowColor: '#ff0000',
      shadowOffset: { width: 1, height: 1 },
      shadowRadius: 4,
    }),
    caseOf('aspectRatio', { aspectRatio: 2 }),
    caseOf('cursor', { cursor: 'pointer' }),
    caseOf('pointerEvents', { pointerEvents: 'none' }),
    caseOf('userSelect', { userSelect: 'none' }),
    caseOf('borderStyle dashed', { borderStyle: 'dashed', borderWidth: 1 }),
    caseOf('corner radius single', { borderTopLeftRadius: 8, borderBottomRightRadius: 4 }),
    caseOf('per-side border width', { borderTopWidth: 2, borderBottomWidth: 1 }),
    caseOf('marginHorizontal token', { marginHorizontal: '$spacing16' }),
    caseOf('paddingVertical number', { paddingVertical: 6 }),
    caseOf('outline', { outlineWidth: 1, outlineStyle: 'solid', outlineColor: '#123456', outlineOffset: 2 }),
    caseOf('touchAction+contain', { touchAction: 'none', contain: 'layout' }),
    caseOf('filter', { filter: 'blur(4px)' }),
    caseOf('backdropFilter', { backdropFilter: 'blur(2px)' }),
    caseOf('transition', { transition: 'opacity 0.2s ease' }),
    caseOf('zIndex negative', { zIndex: -1 }),
  ]
}

export function buildMatrixSections(): MatrixSection[] {
  return [
    { title: 'Variants', cases: variantCases() },
    { title: 'Flexbox enums', cases: flexboxEnumCases() },
    { title: 'Flex numerics', cases: flexNumericCases() },
    { title: 'Gaps', cases: gapCases() },
    { title: 'Margin & padding', cases: spacingCases() },
    { title: 'Sizing', cases: sizingCases() },
    { title: 'Colors & borders', cases: colorCases() },
    { title: 'Radius, opacity & overflow', cases: visualCases() },
    { title: 'Positioning', cases: positionCases() },
    { title: 'Composite layouts', cases: compositeCases() },
    { title: 'Hover styles', cases: hoverCases() },
    { title: 'Press styles', cases: pressCases() },
    { title: 'Focus styles', cases: focusCases() },
    { title: 'Responsive media', cases: responsiveCases() },
    { title: 'Platform overrides', cases: platformCases() },
    { title: 'Theme overrides', cases: themeCases() },
    { title: 'Disabled state', cases: disabledCases() },
    { title: 'Group states', cases: groupCases() },
    { title: 'Animation presets', cases: animationCases() },
    { title: 'Long-tail styles', cases: longTailCases() },
  ]
}

export function buildMatrix(): MatrixCase[] {
  return buildMatrixSections().flatMap((section) => section.cases)
}
