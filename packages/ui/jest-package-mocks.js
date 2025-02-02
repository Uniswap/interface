/**
 * Common mocks for this package. This file is intended to be imported in the jest-setup.js file of the package.
 *
 * Notes:
 * * Try not to add test specific mocks here.
 * * Be wary of the import order.
 * * mocks can be overridden
 */

jest.mock('ui/src/assets', () => {
  const assets = {
    ...jest.requireActual('ui/src/assets'),
  }

  Object.keys(assets).map((key) => {
    assets[key] = `mock-asset-${key}.png`
  })

  return assets
})
