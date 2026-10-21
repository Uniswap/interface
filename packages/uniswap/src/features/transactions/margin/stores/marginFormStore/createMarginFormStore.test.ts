import {
  createMarginFormStore,
  DEFAULT_MARGIN_FORM_STATE,
} from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import { isDefaultMarginVenues } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/marginVenuePreferences'
import { describe, expect, it } from 'vitest'

describe('marginFormStore', () => {
  it('defaults to a venue-free pair key', () => {
    expect(DEFAULT_MARGIN_FORM_STATE.pairKey).not.toMatch(/MORPHO|AAVE/)
    expect(DEFAULT_MARGIN_FORM_STATE.pairKey.split('-')).toHaveLength(2)
  })

  it('defaults to no venue exclusions', () => {
    const store = createMarginFormStore({ initialState: undefined })
    expect(isDefaultMarginVenues({ excludedVenues: store.getState().excludedVenues })).toBe(true)
  })

  it('toggleVenue excludes then re-includes', () => {
    const store = createMarginFormStore({ initialState: undefined })
    store.getState().actions.toggleVenue('MORPHO')
    expect(store.getState().excludedVenues).toEqual(['MORPHO'])
    store.getState().actions.toggleVenue('AAVE_V3')
    expect(store.getState().excludedVenues).toEqual(['MORPHO', 'AAVE_V3'])
    store.getState().actions.toggleVenue('MORPHO')
    expect(store.getState().excludedVenues).toEqual(['AAVE_V3'])
    store.getState().actions.toggleVenue('AAVE_V3')
    expect(isDefaultMarginVenues({ excludedVenues: store.getState().excludedVenues })).toBe(true)
  })

  // The master switch's mechanism. Unlike `reset` it touches nothing else on the form.
  it('resetVenues clears the exclusions without disturbing the rest of the form', () => {
    const store = createMarginFormStore({ initialState: { excludedVenues: ['MORPHO', 'AAVE_V3'], leverage: 4 } })
    store.getState().actions.resetVenues()
    expect(store.getState().excludedVenues).toEqual([])
    expect(store.getState().leverage).toBe(4)
  })

  it('reset clears the exclusions back to the default', () => {
    const store = createMarginFormStore({ initialState: { excludedVenues: ['MORPHO'] } })
    expect(store.getState().excludedVenues).toEqual(['MORPHO'])
    store.getState().actions.reset()
    expect(store.getState().excludedVenues).toEqual([])
  })
})
