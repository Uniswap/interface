export function mockUIAssets(): void {
  jest.mock('ui/src/assets', () => {
    const assets: Record<string, unknown> = {
      ...jest.requireActual('ui/src/assets'),
    }

    Object.keys(assets).map((key) => {
      assets[key] = `mock-asset-${key}.png`
    })

    return assets
  })
}
