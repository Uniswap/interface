/**
 * The View parity matrix: layout props only (display / position / dimension /
 * flex / spacing families), deliberately small. View is a thin wrapper on the
 * shared compat compiler (INFRA-2950) — every non-layout pool (colors, pseudo
 * states, media, group, themes, long tail) is proven byte-level by the Flex
 * binding of the same compiler; see `exclusions.ts`.
 */
// Relative cross-package import: a package dep edge tailwind → mycelium would cycle (mycelium already depends on tailwind).
// nx-ignore-next-line
import type { ViewCompatProps } from '../../../../mycelium/src/view-compat/compile'
import type { ThemeName } from '../core/theme'

export interface MatrixCase {
  name: string
  props: ViewCompatProps
  theme: ThemeName
}

/** A titled slice of the matrix — the workbench verification board renders one grid per section. */
export interface MatrixSection {
  title: string
  cases: MatrixCase[]
}

const SPACE_VALUES = ['$spacing12', 7] as const

function caseOf(name: string, props: ViewCompatProps): MatrixCase {
  return { name, props, theme: 'light' }
}

function flexboxEnumCases(): MatrixCase[] {
  const cases: MatrixCase[] = [caseOf('base (no props)', {})]
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
  cases.push(caseOf('gap=0', { gap: 0 }), caseOf('gap+rowGap override', { gap: '$gap8', rowGap: '$spacing24' }))
  return cases
}

function spacingCases(): MatrixCase[] {
  const cases: MatrixCase[] = []
  const spacingProps = ['m', 'mx', 'my', 'mt', 'mb', 'ml', 'mr', 'p', 'px', 'py', 'pt', 'pb', 'pl', 'pr'] as const
  for (const prop of spacingProps) {
    for (const v of SPACE_VALUES) {
      cases.push(caseOf(`${prop}=${String(v)}`, { [prop]: v } as ViewCompatProps))
    }
  }
  cases.push(
    caseOf('negative mt', { mt: -8 }),
    caseOf('marginHorizontal token', { marginHorizontal: '$spacing16' }),
    caseOf('paddingVertical number', { paddingVertical: 6 }),
    caseOf('p overridden by px+pt', { p: '$spacing16', px: '$spacing8', pt: 2 }),
  )
  return cases
}

function dimensionCases(): MatrixCase[] {
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
      cases.push(caseOf(`${prop}=${String(v)}`, { [prop]: v } as ViewCompatProps))
    }
  }
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
    caseOf('inset number', { inset: 8 }),
    caseOf('inset token', { inset: '$spacing16' }),
  ]
}

function compositeCases(): MatrixCase[] {
  return [
    caseOf('row toolbar layout', {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '$gap8',
      px: '$spacing16',
      height: 48,
    }),
    caseOf('absolute fill panel', {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      flexGrow: 1,
      p: '$spacing24',
    }),
  ]
}

export function buildMatrixSections(): MatrixSection[] {
  return [
    { title: 'Flexbox enums', cases: flexboxEnumCases() },
    { title: 'Flex numerics', cases: flexNumericCases() },
    { title: 'Gaps', cases: gapCases() },
    { title: 'Margin & padding', cases: spacingCases() },
    { title: 'Sizing', cases: dimensionCases() },
    { title: 'Positioning', cases: positionCases() },
    { title: 'Composite layouts', cases: compositeCases() },
  ]
}

export function buildMatrix(): MatrixCase[] {
  return buildMatrixSections().flatMap((section) => section.cases)
}
