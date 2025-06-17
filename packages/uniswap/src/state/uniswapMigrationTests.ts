/* eslint-disable @typescript-eslint/no-explicit-any */
import { removeThaiBahtFromFiatCurrency } from 'uniswap/src/state/uniswapMigrations'

// Mobile: 89
// Extension: 25
// Web: 25
it('removes THB from fiat currency', () => {
  const state = {
    userSettings: {
      currentCurrency: 'THB',
    },
  }
  const newState = removeThaiBahtFromFiatCurrency(state)
  expect(newState.userSettings.currentCurrency).toEqual('USD')

  const stateWithJPY = {
    userSettings: {
      currentCurrency: 'JPY',
    },
  }
  const newStateWithJPY = removeThaiBahtFromFiatCurrency(stateWithJPY)
  expect(newStateWithJPY.userSettings.currentCurrency).toEqual('JPY')
})

export function testRemoveTHBFromCurrency(migration: (state: any) => any, prevSchema: any): void {
  const result = migration(prevSchema)

  if (prevSchema.userSettings.currentCurrency === 'THB') {
    expect(result.userSettings.currentCurrency).toEqual('USD')
  } else {
    expect(result.userSettings.currentCurrency).toEqual(prevSchema.userSettings.currentCurrency)
  }
}
