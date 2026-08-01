import { configureStore, Store } from '@reduxjs/toolkit'
import {
  initialUserSettingsState,
  setEnableCustomGasFeeEntry,
  setHideSmallBalances,
  setHideSpamTokens,
  UserSettingsState,
  userSettingsReducer,
} from 'uniswap/src/features/settings/slice'

describe(userSettingsReducer, () => {
  let store: Store<UserSettingsState>

  beforeEach(() => {
    store = configureStore({ reducer: userSettingsReducer, preloadedState: initialUserSettingsState })
  })

  it('sets small balances setting from default', () => {
    expect(store.getState().hideSpamTokens).toEqual(true)
    store.dispatch(setHideSmallBalances(false))
    expect(store.getState().hideSmallBalances).toEqual(false)
  })

  it('sets spam tokens setting from default', () => {
    expect(store.getState().hideSpamTokens).toEqual(true)
    store.dispatch(setHideSpamTokens(false))
    expect(store.getState().hideSpamTokens).toEqual(false)
  })

  it('starts enableCustomGasFeeEntry as false', () => {
    expect(store.getState().enableCustomGasFeeEntry).toEqual(false)
  })

  it('toggles enableCustomGasFeeEntry on and off', () => {
    store.dispatch(setEnableCustomGasFeeEntry(true))
    expect(store.getState().enableCustomGasFeeEntry).toEqual(true)
    store.dispatch(setEnableCustomGasFeeEntry(false))
    expect(store.getState().enableCustomGasFeeEntry).toEqual(false)
  })
})
