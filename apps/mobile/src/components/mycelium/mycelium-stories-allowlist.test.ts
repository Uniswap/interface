import { readdirSync, readFileSync } from 'fs'
import { dirname, join, relative } from 'path'

/**
 * Guard for the on-device Storybook: every mycelium symbol a mobile story
 * imports must come from an explicitly native-safe surface.
 *
 * Why: the @universe/mycelium barrel (and several subpaths) also export
 * web-only compat primitives — ButtonCompat renders DOM elements via
 * `packages/mycelium/src/compat/dom.tsx` (`React.createElement(tag ?? 'div')`),
 * the ~270 icons are raw `<svg>`, and the INFRA-3021 compat modules are
 * throwing stubs on native. A story rendering any of them crashes the
 * on-device Storybook runner with an Invariant Violation, not a styling miss.
 * This test fails at CI time instead, naming the offending file and symbol.
 * Flex/Text/View used to be on that forbidden list; they gained real React
 * Native legs in #37970 (INFRA-3229) and are allowlisted below.
 *
 * Scope: only static `import … from '@universe/mycelium…'` statements in
 * `*.stories.tsx?` files — helper modules, `require()`, and dynamic `import()` bypass this guard.
 */

const SRC_ROOT = join(dirname(new URL(import.meta.url).pathname), '..', '..')

/** Native-safe mycelium surfaces, keyed by import specifier. Sets mirror each module's index exports. Intentionally manual and additive-on-demand — new surfaces fail closed until allowlisted. */
const ALLOWLIST: Readonly<Record<string, ReadonlySet<string>>> = {
  // Root barrel: UniversalList (Legend List native leg) and its types, plus
  // Accordion (INFRA-3702: real .native.tsx leg over compat Flex hosts).
  '@universe/mycelium': new Set([
    'UniversalList',
    'UniversalListProps',
    'UniversalListRef',
    'UniversalListRenderItemInfo',
    'UniversalListStyle',
    'Accordion',
    'AccordionProps',
  ]),
  '@universe/mycelium/segmented-control-compat': new Set([
    'SegmentedControl',
    'SegmentedControlGapToken',
    'SegmentedControlOption',
    'SegmentedControlProps',
    'SegmentedControlSize',
  ]),
  '@universe/mycelium/shimmer': new Set(['Shimmer', 'ShimmerProps']),
  // Native legs landed in #37970 (INFRA-3229): real RN View/Text hosts sharing the
  // web className compiler plus an RN style lane for scanner-invisible classes.
  // ButtonCompat and the icon exports remain web-only — do NOT allowlist those.
  '@universe/mycelium/flex-compat': new Set([
    'FlexCompat',
    'FlexCompatProps',
    'FlexCompatPseudoProps',
    'FlexCompatStyleProps',
    'GroupState',
    'GroupStatePropKey',
    'MediaPropKey',
  ]),
  '@universe/mycelium/view-compat': new Set([
    'ViewCompat',
    'ViewCompatProps',
    'ViewCompatPseudoProps',
    'ViewCompatStyleProps',
    'GroupState',
    'GroupStatePropKey',
    'MediaPropKey',
  ]),
  '@universe/mycelium/text-compat': new Set([
    'TextCompat',
    'TextCompatProps',
    'TextCompatStyleProps',
    'TextVariant',
    'ColorValue',
    'FontFamilyToken',
    'FontSizeValue',
    'FontWeightValue',
    'LineHeightValue',
    'SizeValue',
    'SpaceValue',
    'MediaPropKey',
  ]),
  '@universe/mycelium/touchable-area': new Set([
    'TouchableAreaCompat',
    'TouchableAreaCompatEvent',
    'TouchableAreaCompatProps',
    'TouchableAreaCompatPseudoProps',
    'TouchableAreaCompatStyleProps',
    'TouchableAreaVariant',
    'GroupState',
    'GroupStatePropKey',
    'MediaPropKey',
  ]),
  '@universe/mycelium/floating-overlay': new Set([
    'anchorRectFromPoint',
    'computeArrowPosition',
    'computeFloatingPosition',
    'joinPlacement',
    'resolveOffset',
    'splitPlacement',
    'ArrowPosition',
    'ComputeArrowPositionParams',
    'ComputeFloatingPositionParams',
    'FloatingOverlayAlign',
    'FloatingOverlayAnchorPoint',
    'FloatingOverlayOffset',
    'FloatingOverlayPlacement',
    'FloatingOverlayPosition',
    'FloatingOverlayRect',
    'FloatingOverlaySide',
    'FloatingOverlaySize',
    'FloatingOverlayAnchor',
    'FloatingOverlayArrow',
    'FloatingOverlayContent',
    'FloatingOverlayProvider',
    'FloatingOverlayRoot',
    'useFloatingOverlayState',
    'FLOATING_OVERLAY_LAYER_TEST_ID',
    'FloatingOverlayAnchorProps',
    'FloatingOverlayArrowProps',
    'FloatingOverlayContentProps',
    'FloatingOverlayProviderProps',
    'FloatingOverlayRootProps',
    'FloatingOverlayState',
  ]),
  '@universe/mycelium/theme-hooks-compat': new Set([
    'opacify',
    'opacifyRaw',
    'BREAKPOINT_PX',
    'HEIGHT_BREAKPOINT_PX',
    'MediaQueryKey',
    'THEME_COLOR_NAMES',
    'ThemeColorName',
    'useDeviceDimensions',
    'DeviceDimensions',
    'useIsDarkMode',
    'useMedia',
    'MediaState',
    'useSporeColors',
    'DynamicColor',
    'SporeColor',
    'SporeColorKey',
    'UseSporeColorsReturn',
  ]),
}

function collectStoryFiles(dir: string): string[] {
  const files: string[] = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...collectStoryFiles(full))
    } else if (/\.stories\.tsx?$/.test(entry.name)) {
      files.push(full)
    }
  }
  return files
}

interface MyceliumImport {
  file: string
  specifier: string
  /** Imported names as written in the module (aliases stripped); 'default'/'* as ns' for non-named clauses. */
  symbols: string[]
}

// Anchored to real import statements — the clause between `import` and `from` cannot contain
// quotes, so the literal `from '@universe/mycelium'` inside a comment or string never matches.
const MYCELIUM_IMPORT_REGEX = /^[ \t]*import\s+([^'"]+?)\s+from\s+['"](@universe\/mycelium[^'"]*)['"]/gm

function parseImportClause(rawClause: string): string[] {
  const clause = rawClause.replace(/^\s*type\s+/, '')
  const symbols: string[] = []
  const braceMatch = /\{([\s\S]*)\}/.exec(clause)
  const beforeBrace = clause
    .replace(/\{[\s\S]*\}/, '')
    .replace(/,\s*$/, '')
    .trim()
  if (beforeBrace.startsWith('*')) {
    symbols.push('* (namespace import)')
  } else if (beforeBrace.length > 0) {
    symbols.push('default')
  }
  if (braceMatch?.[1] !== undefined) {
    for (const raw of braceMatch[1].split(',')) {
      const name = raw
        .trim()
        .replace(/^type\s+/, '')
        .replace(/\s+as\s+[\w$]+$/, '')
      if (name.length > 0) {
        symbols.push(name)
      }
    }
  }
  return symbols
}

function collectMyceliumImports(file: string): MyceliumImport[] {
  const source = readFileSync(file, 'utf8')
  const imports: MyceliumImport[] = []
  for (const match of source.matchAll(MYCELIUM_IMPORT_REGEX)) {
    const clause = match[1]
    const specifier = match[2]
    if (clause === undefined || specifier === undefined) {
      continue
    }
    imports.push({ file, specifier, symbols: parseImportClause(clause) })
  }
  return imports
}

describe('mycelium story imports stay on native-safe surfaces', () => {
  const storyFiles = collectStoryFiles(SRC_ROOT)

  it('finds the story files (walker sanity check)', () => {
    const names = storyFiles.map((file) => relative(SRC_ROOT, file))
    expect(names).toEqual(expect.arrayContaining(['components/mycelium/FloatingOverlayMigration.stories.tsx']))
  })

  it('every imported mycelium symbol is allowlisted', () => {
    const violations: string[] = []
    for (const file of storyFiles) {
      for (const { specifier, symbols } of collectMyceliumImports(file)) {
        const allowed = ALLOWLIST[specifier]
        const shortPath = relative(SRC_ROOT, file)
        if (allowed === undefined) {
          violations.push(
            `${shortPath}: imports from '${specifier}', which is not a native-safe mycelium surface ` +
              `(allowed: ${Object.keys(ALLOWLIST).join(', ')})`,
          )
          continue
        }
        for (const symbol of symbols) {
          if (!allowed.has(symbol)) {
            violations.push(
              `${shortPath}: '${symbol}' from '${specifier}' is not in the native-safe allowlist — ` +
                `it may render DOM elements or throw on native (see this test's header comment)`,
            )
          }
        }
      }
    }
    expect(violations.join('\n')).toBe('')
  })
})
