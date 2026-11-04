/**
 * Platform-leg contract for the icon factory (INFRA-3508), following
 * `checkbox-compat/platform-legs.test.ts` / `modal-close-icon`.
 *
 * Why this has to exist: `moduleSuffixes` is configured nowhere in the repo,
 * so `tsc` only ever resolves the BASE legs — a `.native` leg cannot carry a
 * different symbol set without a bundler hitting a missing export at runtime.
 * Unlike the compat components, the icon factory's base leg IS the web
 * implementation (the `./icons/*` exports map resolves deep icon imports to
 * exact base files, so the base cannot be a throwing stub); base ≡ native
 * export parity is what this suite proves, for the factory and for the
 * `svg-elements` host-element shim the generated icons import.
 */
import { describe, expect, it, vi } from 'vitest'
import * as baseFactory from './createIcon.tsx'
import * as baseElements from './svg-elements.ts'

// The native legs import react-native / react-native-svg / reanimated, whose
// real builds require react-native's flow sources; the real modules are
// exercised on device, not under this jsdom config.
vi.mock('react-native-svg', () => import('../../modal-close-icon/testing/react-native-svg-mock'))
vi.mock('react-native', () => ({
  Dimensions: {
    get: () => ({ width: 800, height: 600 }),
    addEventListener: () => ({ remove: (): void => undefined }),
  },
}))
vi.mock('react-native-reanimated', () => ({
  default: { createAnimatedComponent: <T>(component: T): T => component },
}))
vi.mock('uniwind', () => ({ useUniwind: () => ({ theme: 'light' }) }))

describe('export parity across the icon factory legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    const native = await import('./createIcon.native')
    expect(Object.keys(native).sort()).toEqual(Object.keys(baseFactory).sort())
    expect(Object.keys(native)).toContain('createIcon')
  })

  it('both legs are real factories, not stubs', async () => {
    const native = await import('./createIcon.native')
    for (const leg of [baseFactory.createIcon, native.createIcon]) {
      expect(typeof leg).toBe('function')
    }
  })

  it('the native leg is NOT the base leg (a real split, not an accidental alias)', async () => {
    const native = await import('./createIcon.native')
    expect(native.createIcon).not.toBe(baseFactory.createIcon)
  })
})

describe('export parity across the svg-elements legs', () => {
  it('the native leg exports exactly the base leg symbol set', async () => {
    // The rnsvg mock above only carries Svg/Path; import the real module's
    // export names via its source instead of executing it — the mocked module
    // shape is what vitest serves, so compare against the base leg by reading
    // the native leg's source text (a pure re-export list).
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const nativeSource = readFileSync(join(__dirname, 'svg-elements.native.ts'), 'utf8')
    const exportBlock = nativeSource.match(/export \{([^}]*)\} from 'react-native-svg'/)?.[1]
    expect(exportBlock).toBeDefined()
    const reExportedNames = (exportBlock ?? '')
      .split(',')
      .map((name) => name.trim())
      .filter((name) => name.length > 0)
    // Filter-effect primitives react-native-svg doesn't implement are
    // locally defined via `domTag` (raw host tags) rather than re-exported
    // from the package — see svg-elements.native.ts's header.
    const domTagNames = [...nativeSource.matchAll(/export const (\w+) = domTag\(/g)].map((match) => match[1] as string)
    const nativeNames = [...reExportedNames, ...domTagNames].sort()
    expect(nativeNames).toEqual(Object.keys(baseElements).sort())
  })

  it('the base leg renders plain DOM tag names (byte-identical markup to the previous emission)', () => {
    expect(baseElements.Svg).toBe('svg')
    expect(baseElements.Path).toBe('path')
    expect(baseElements.ClipPath).toBe('clipPath')
    expect(baseElements.LinearGradient).toBe('linearGradient')
    expect(baseElements.FeGaussianBlur).toBe('feGaussianBlur')
  })
})

describe('the svg-elements export set covers the generator TAG_MAP', () => {
  it('every TAG_MAP value is exported by the base leg', async () => {
    const { readFileSync } = await import('node:fs')
    const { join } = await import('node:path')
    const generatorSource = readFileSync(join(__dirname, '..', '..', 'scripts', 'componentize-icons.ts'), 'utf8')
    const tagMapBlock = generatorSource.match(/const TAG_MAP: Record<string, string> = \{([^}]*)\}/)?.[1]
    expect(tagMapBlock).toBeDefined()
    const mappedNames = new Set(
      [...(tagMapBlock ?? '').matchAll(/:\s*'([A-Za-z]+)'/g)].map((entry) => entry[1] as string),
    )
    expect(mappedNames.size).toBeGreaterThan(0)
    for (const name of mappedNames) {
      expect(Object.keys(baseElements), `TAG_MAP maps to ${name}, missing from svg-elements`).toContain(name)
    }
  })
})
