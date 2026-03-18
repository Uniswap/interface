import { createStore, Store } from '@reduxjs/toolkit'
import {
  initialUserSettingsState,
  setHideSmallBalances,
  setHideSpamTokens,
  UserSettingsState,
  userSettingsReducer,
} from 'uniswap/src/features/settings/slice'

describe(userSettingsReducer, () => {
  let store: Store<UserSettingsState>

  beforeEach(() => {
    store = createStore(userSettingsReducer, initialUserSettingsState)
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
})
