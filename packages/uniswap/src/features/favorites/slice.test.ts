import { createStore, Store } from '@reduxjs/toolkit'
import {
  addFavoriteToken,
  FavoritesState,
  favoritesReducer,
  removeFavoriteToken,
} from 'uniswap/src/features/favorites/slice'

describe(favoritesReducer, () => {
  let store: Store<FavoritesState>

  beforeAll(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => undefined)
  })

  beforeEach(() => {
    store = createStore(favoritesReducer, {
      tokens: [],
      watchedAddresses: [],
    })
  })

  it('adds favorites', () => {
    expect(store.getState().tokens.length).toEqual(0)

    store.dispatch(addFavoriteToken({ currencyId: '1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9' }))
    expect(store.getState().tokens).toEqual(['1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9'])

    // handles dupes
    store.dispatch(addFavoriteToken({ currencyId: '1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9' }))
    expect(store.getState().tokens).toEqual(['1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9'])
  })

  it('removes favorites', () => {
    store.dispatch(addFavoriteToken({ currencyId: '1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9' }))
    store.dispatch(addFavoriteToken({ currencyId: '10-0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' }))

    expect(store.getState().tokens).toEqual([
      '1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9',
      '10-0x0b2c639c533813f4aa9d7837caf62653d097ff85',
    ])

    store.dispatch(removeFavoriteToken({ currencyId: '10-0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' }))
    expect(store.getState().tokens).toEqual(['1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9'])

    // handles missing tokens
    store.dispatch(removeFavoriteToken({ currencyId: '10-0x0b2C639c533813f4Aa9D7837CAf62653d097Ff85' }))

    store.dispatch(removeFavoriteToken({ currencyId: '1-0x72e4f9f808c49a2a61de9c5896298920dc4eeea9' }))
    expect(store.getState().tokens).toEqual([])
  })
})
