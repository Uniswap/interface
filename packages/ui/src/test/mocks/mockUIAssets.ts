import { vi } from 'vitest'

export function mockUIAssets(): void {
  // oxlint-disable-next-line vitest/hoisted-apis-on-top -- suppressed
  vi.mock('@universe/mycelium/assets', () => {
    const assets: Record<string, unknown> = {
      ...vi.importActual('@universe/mycelium/assets'),
    }

    Object.keys(assets).map((key) => {
      assets[key] = `mock-asset-${key}.png`
    })

    return assets
  })
}
