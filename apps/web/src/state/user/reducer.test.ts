import { configureStore } from '@reduxjs/toolkit'
import { Store } from 'redux'
import reducer, {
  initialState,
  UserState,
  updateHideClosedPositions,
  updateIsEmbeddedWalletBackedUp,
  updateUserDeadline,
  updateUserRouterPreference,
  updateUserSlippageTolerance,
} from '~/state/user/reducer'
import { RouterPreference } from '~/types/routing'

describe('swap reducer', () => {
  let store: Store<UserState>

  beforeEach(() => {
    store = configureStore({ reducer, preloadedState: initialState })
  })

  describe('updateUserSlippageTolerance', () => {
    it('updates the userSlippageTolerance', () => {
      store.dispatch(updateUserSlippageTolerance({ userSlippageTolerance: '0.5' }))
      expect(store.getState().userSlippageTolerance).toEqual('0.5')
    })
  })

  describe('updateUserDeadline', () => {
    it('updates the userDeadline', () => {
      store.dispatch(updateUserDeadline({ userDeadline: 5 }))
      expect(store.getState().userDeadline).toEqual(5)
    })
  })

  describe('updateRouterPreference', () => {
    it('updates the routerPreference', () => {
      store.dispatch(updateUserRouterPreference({ userRouterPreference: RouterPreference.API }))
      expect(store.getState().userRouterPreference).toEqual(RouterPreference.API)
    })
  })

  describe('updateHideClosedPositions', () => {
    it('updates the userHideClosedPositions', () => {
      store.dispatch(updateHideClosedPositions({ userHideClosedPositions: true }))
      expect(store.getState().userHideClosedPositions).toEqual(true)
    })
  })

  describe('updateIsEmbeddedWalletBackedUp', () => {
    it('updates the isEmbeddedWalletBackedUp', () => {
      expect(store.getState().isEmbeddedWalletBackedUp).toEqual(false)

      store.dispatch(updateIsEmbeddedWalletBackedUp({ isEmbeddedWalletBackedUp: true }))
      expect(store.getState().isEmbeddedWalletBackedUp).toEqual(true)
    })
  })
})
