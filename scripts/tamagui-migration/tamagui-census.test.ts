/**
 * Run with `bun test scripts/tamagui-migration/tamagui-census.test.ts`
 */
import { describe, expect, test } from 'bun:test'
import {
  categorize,
  classifyConvertibility,
  countUsages,
  estateOf,
  isSourceFile,
  parseImports,
  platformOf,
  specifierKindOf,
  usageScore,
} from './tamagui-census'

describe('specifierKindOf', () => {
  test('classifies the three frontier specifier kinds', () => {
    expect(specifierKindOf('tamagui')).toBe('tamagui')
    expect(specifierKindOf('tamagui/linear-gradient')).toBe('tamagui')
    expect(specifierKindOf('@tamagui/portal')).toBe('tamagui-scoped')
    expect(specifierKindOf('ui/src')).toBe('ui-src')
    expect(specifierKindOf('ui/src/theme')).toBe('ui-src')
  })

  test('ignores non-frontier specifiers', () => {
    expect(specifierKindOf('react')).toBeNull()
    expect(specifierKindOf('ui/srcish')).toBeNull()
    expect(specifierKindOf('tamagui-fake')).toBeNull()
    expect(specifierKindOf('uniswap/src/components')).toBeNull()
  })
})

describe('estateOf', () => {
  test('maps paths to estates', () => {
    expect(estateOf('apps/web/src/App.tsx')).toBe('web')
    expect(estateOf('apps/extension/src/x.ts')).toBe('extension')
    expect(estateOf('apps/mobile/src/x.ts')).toBe('mobile')
    expect(estateOf('apps/cli/src/x.ts')).toBe('apps-other')
    expect(estateOf('packages/wallet/src/x.ts')).toBe('wallet')
    expect(estateOf('packages/ui/src/x.ts')).toBe('ui')
    expect(estateOf('packages/uniswap/src/x.ts')).toBe('packages-shared')
  })
})

describe('isSourceFile', () => {
  test('accepts source extensions and rejects exclusions', () => {
    expect(isSourceFile('apps/web/src/a.tsx')).toBe(true)
    expect(isSourceFile('apps/web/src/a.d.ts')).toBe(false)
    expect(isSourceFile('apps/web/src/a.css')).toBe(false)
    expect(isSourceFile('apps/web/node_modules/x/a.ts')).toBe(false)
    expect(isSourceFile('packages/x/dist/a.ts')).toBe(false)
    expect(isSourceFile('packages/x/src/__generated__/a.ts')).toBe(false)
  })
})

describe('parseImports', () => {
  test('parses named, aliased, default, namespace, and type imports', () => {
    const content = [
      "import { Flex, Text as T, type FlexProps } from 'ui/src'",
      "import type { ColorTokens } from 'tamagui'",
      "import * as icons from 'ui/src/components/icons'",
      "import React from 'react'",
    ].join('\n')
    const { imports } = parseImports(content)
    expect(imports).toHaveLength(3)

    const uiSrc = imports.find((imp) => imp.module === 'ui/src')
    expect(uiSrc?.names.map((n) => `${n.name}->${n.local}`)).toEqual(['Flex->Flex', 'FlexProps->FlexProps', 'Text->T'])
    expect(uiSrc?.names.find((n) => n.name === 'FlexProps')?.typeOnly).toBe(true)
    expect(uiSrc?.typeOnly).toBe(false)

    const tamagui = imports.find((imp) => imp.module === 'tamagui')
    expect(tamagui?.typeOnly).toBe(true)

    const iconsImport = imports.find((imp) => imp.module === 'ui/src/components/icons')
    expect(iconsImport?.names).toEqual([{ name: '*', local: 'icons', typeOnly: false, category: 'icon' }])
  })

  test('handles multi-line imports and export-from', () => {
    const content = ["import {", '  Flex,', '  styled,', "} from 'ui/src'", "export { Foo } from 'ui/src/theme'"].join('\n')
    const { imports } = parseImports(content)
    expect(imports).toHaveLength(2)
    expect(imports[0]?.names.map((n) => n.name)).toEqual(['Flex', 'styled'])
    expect(imports[1]?.mechanism).toBe('import')
  })

  test('records side-effect and mock mechanisms separately', () => {
    const content = [
      "import '@tamagui/core/reset.css'",
      "vi.mock('react-native-svg', () => require('@tamagui/react-native-svg'))",
      "const mod = await import('tamagui')",
    ].join('\n')
    const { imports } = parseImports(content)
    expect(imports.map((imp) => imp.mechanism).sort()).toEqual(['mock', 'mock', 'side-effect'])
  })
})

describe('categorize', () => {
  test('categorizes by module path and name', () => {
    expect(categorize('ui/src', 'styled')).toBe('styled')
    expect(categorize('ui/src', 'Flex')).toBe('primitive')
    expect(categorize('ui/src', 'useSporeColors')).toBe('token-theme')
    expect(categorize('ui/src', 'useMedia')).toBe('media')
    expect(categorize('ui/src', 'AnimatePresence')).toBe('animation')
    expect(categorize('ui/src', 'Button')).toBe('component')
    expect(categorize('ui/src/components/icons/X', 'X')).toBe('icon')
    expect(categorize('ui/src/theme', 'iconSizes')).toBe('token-theme')
    expect(categorize('ui/src/animations', 'anything')).toBe('animation')
    expect(categorize('ui/src/utils/format', 'formatFoo')).toBe('other')
  })
})

describe('countUsages + usageScore', () => {
  test('counts binding references outside import statements and prop usages', () => {
    const content = [
      "import { Flex, styled } from 'ui/src'",
      'const Row = styled(Flex, { animation: "fast" })',
      'export const App = () => <Flex $md={{ gap: 4 }} $platform-web={{ x: 1 }} />',
    ].join('\n')
    const { imports, clauseRanges } = parseImports(content)
    const counts = countUsages(content, imports, clauseRanges)
    expect(counts.bindingReferences).toBe(3) // Flex x2 + styled x1, all outside the import clause
    expect(counts.styledCalls).toBe(1)
    expect(counts.animationProps).toBe(1)
    expect(counts.mediaShorthandProps).toBe(1)
    expect(counts.platformThemeProps).toBe(1)
    expect(usageScore(counts)).toBe(7)
  })
})

describe('platformOf', () => {
  const files = new Set([
    'packages/uniswap/src/a.tsx',
    'packages/uniswap/src/a.web.tsx',
    'packages/uniswap/src/b.tsx',
    'packages/uniswap/src/b.native.tsx',
    'packages/uniswap/src/c.tsx',
  ])

  test('suffix wins', () => {
    expect(platformOf('packages/uniswap/src/a.web.tsx', 'packages-shared', files).platform).toBe('web-only')
    expect(platformOf('packages/uniswap/src/b.native.tsx', 'packages-shared', files).platform).toBe('native-only')
  })

  test('unsuffixed file with a .web sibling serves native (and vice versa)', () => {
    expect(platformOf('packages/uniswap/src/a.tsx', 'packages-shared', files)).toEqual({
      platform: 'native-only',
      platformSuffix: null,
      platformSiblings: ['web'],
    })
    expect(platformOf('packages/uniswap/src/b.tsx', 'packages-shared', files).platform).toBe('web-only')
    expect(platformOf('packages/uniswap/src/c.tsx', 'packages-shared', files).platform).toBe('cross-platform')
  })

  test('estate constrains platform for single-platform estates', () => {
    expect(platformOf('apps/web/src/x.tsx', 'web', files).platform).toBe('web-only')
    expect(platformOf('apps/extension/src/x.tsx', 'extension', files).platform).toBe('web-only')
    expect(platformOf('apps/mobile/src/x.tsx', 'mobile', files).platform).toBe('native-only')
  })
})

describe('classifyConvertibility', () => {
  function classify(content: string, estate: Parameters<typeof classifyConvertibility>[0] = 'web') {
    const { imports, clauseRanges } = parseImports(content)
    return classifyConvertibility(estate, imports, countUsages(content, imports, clauseRanges))
  }

  test('leaf: only primitives/icons/token values', () => {
    const result = classify(
      ["import { Flex, Text } from 'ui/src'", "import { X } from 'ui/src/components/icons/X'", '<Flex><Text/><X/></Flex>'].join(
        '\n',
      ),
    )
    expect(result.tier).toBe('leaf')
  })

  test('simple: leaf + theme hooks', () => {
    const result = classify(["import { Flex, useSporeColors } from 'ui/src'", 'useSporeColors()'].join('\n'))
    expect(result).toEqual({ tier: 'simple', reasons: ['theme-hooks'] })
  })

  test('dependent: composed ui/src components', () => {
    const result = classify("import { Button } from 'ui/src'")
    expect(result).toEqual({ tier: 'dependent', reasons: ['composed-ui-components'] })
  })

  test('coupled: styled factory, media shorthands, animations, direct tamagui', () => {
    expect(classify("import { styled } from 'ui/src'\nconst S = styled(1)").tier).toBe('coupled')
    expect(classify("import { Flex } from 'ui/src'\n<Flex $md={{}} />").tier).toBe('coupled')
    expect(classify("import { Flex } from 'ui/src'\n<Flex animation='fast' />").tier).toBe('coupled')
    expect(classify("import '@tamagui/core/reset.css'").tier).toBe('coupled')
  })

  test('types-only and mock-only tiers', () => {
    expect(classify("import type { FlexProps } from 'ui/src'").tier).toBe('types-only')
    expect(classify("vi.mock('x', () => require('@tamagui/react-native-svg'))").tier).toBe('mock-only')
  })

  test('packages/ui is not classified', () => {
    expect(classify("import { styled } from 'tamagui'", 'ui').tier).toBe('not-classified')
  })
})
