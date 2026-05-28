import { vi } from 'vitest'

export function mockUIAssets(): void {
  // oxlint-disable-next-line vitest/hoisted-apis-on-top -- suppressed
  vi.mock('ui/src/assets', () => {
    const assets: Record<string, unknown> = {
      ...vi.importActual('ui/src/assets'),
    }

    Object.keys(assets).map((key) => {
      assets[key] = `mock-asset-${key}.png`
    })

    return assets
  })
}
