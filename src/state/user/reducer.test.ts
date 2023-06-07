import { createStore, Store } from 'redux'
import { RouterPreference } from 'state/routing/slice'

import { DEFAULT_DEADLINE_FROM_NOW } from '../../constants/misc'
import { updateVersion } from '../global/actions'
import reducer, {
  addSerializedPair,
  addSerializedToken,
  initialState,
  updateHideClosedPositions,
  updateHideUniswapWalletBanner,
  updateSelectedWallet,
  updateUserDeadline,
  updateUserLocale,
  updateUserRouterPreference,
  updateUserSlippageTolerance,
  UserState,
} from './reducer'
import { SlippageTolerance } from './types'

function buildSerializedPair(token0Address: string, token1Address: string, chainId: number) {
  return {
    token0: {
      chainId,
      address: token0Address,
    },
    token1: {
      chainId,
      address: token1Address,
    },
  }
}

describe('swap reducer', () => {
  let store: Store<UserState>

  beforeEach(() => {
    store = createStore(reducer, initialState)
  })

  describe('updateVersion', () => {
    it('has no timestamp originally', () => {
      expect(store.getState().lastUpdateVersionTimestamp).toBeUndefined()
    })
    it('sets the lastUpdateVersionTimestamp', () => {
      const time = new Date().getTime()
      store.dispatch(updateVersion())
      expect(store.getState().lastUpdateVersionTimestamp).toBeGreaterThanOrEqual(time)
    })
    it('sets allowed slippage and deadline', () => {
      store = createStore(reducer, {
        ...initialState,
        userDeadline: undefined,
        userSlippageTolerance: undefined,
      } as any)
      store.dispatch(updateVersion())
      expect(store.getState().userDeadline).toEqual(DEFAULT_DEADLINE_FROM_NOW)
      expect(store.getState().userSlippageTolerance).toEqual(SlippageTolerance.Auto)
    })
    it('sets allowed slippage and deadline to auto', () => {
      store = createStore(reducer, {
        ...initialState,
        userSlippageTolerance: 10,
        userSlippageToleranceHasBeenMigratedToAuto: undefined,
      } as any)
      store.dispatch(updateVersion())
      expect(store.getState().userSlippageToleranceHasBeenMigratedToAuto).toEqual(true)
    })
  })

  describe('updateSelectedWallet', () => {
    it('updates the selected wallet', () => {
      store.dispatch(updateSelectedWallet({ wallet: 'metamask' }))
      expect(store.getState().selectedWallet).toEqual('metamask')
    })
  })

  describe('updateUserLocale', () => {
    it('updates the userLocale', () => {
      store.dispatch(updateUserLocale({ userLocale: 'en' }))
      expect(store.getState().userLocale).toEqual('en')
    })
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

  describe('updateHideUniswapWalletBanner', () => {
    it('updates the hideUniswapWalletBanner', () => {
      store.dispatch(updateHideUniswapWalletBanner({ hideUniswapWalletBanner: true }))
      expect(store.getState().hideUniswapWalletBanner).toEqual(true)
    })
  })

  describe('addSerializedToken', () => {
    it('adds a token to the uninitialized list', () => {
      store = createStore(reducer, {
        ...initialState,
        tokens: undefined as any,
      })
      store.dispatch(
        addSerializedToken({
          serializedToken: {
            chainId: 1,
            address: '0x123',
          },
        })
      )
      expect(store.getState().tokens).toEqual({ 1: { '0x123': { address: '0x123', chainId: 1 } } })
    })
    it('adds a token to the initialized list, no duplicates', () => {
      store.dispatch(addSerializedToken({ serializedToken: { chainId: 1, address: '0x123' } }))
      store.dispatch(addSerializedToken({ serializedToken: { chainId: 1, address: '0x123' } }))
      expect(store.getState().tokens).toEqual({ 1: { '0x123': { address: '0x123', chainId: 1 } } })
    })

    it('adds a new token to the initialized list', () => {
      store.dispatch(addSerializedToken({ serializedToken: { chainId: 1, address: '0x123' } }))
      store.dispatch(addSerializedToken({ serializedToken: { chainId: 1, address: '0x456' } }))
      expect(store.getState().tokens).toEqual({
        1: {
          '0x123': { address: '0x123', chainId: 1 },
          '0x456': { address: '0x456', chainId: 1 },
        },
      })
    })
  })

  describe('addSerializedPair', () => {
    it('adds a pair to the uninitialized list', () => {
      store = createStore(reducer, {
        ...initialState,
      })
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        })
      )
      expect(store.getState().pairs).toEqual({
        1: { '0x123;0x456': buildSerializedPair('0x123', '0x456', 1) },
      })
    })

    it('adds two pair to the initialized list, no duplicates', () => {
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        })
      )
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        })
      )
      expect(store.getState().pairs).toEqual({
        1: { '0x123;0x456': buildSerializedPair('0x123', '0x456', 1) },
      })
    })

    it('adds two new pairs to the initialized list, same chain', () => {
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        })
      )
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x789', 1),
        })
      )
      expect(store.getState().pairs).toEqual({
        1: {
          '0x123;0x456': buildSerializedPair('0x123', '0x456', 1),
          '0x123;0x789': buildSerializedPair('0x123', '0x789', 1),
        },
      })
    })

    it('adds two new pairs to the initialized list, different chains', () => {
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        })
      )
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 5),
        })
      )
      expect(store.getState().pairs).toEqual({
        1: {
          '0x123;0x456': buildSerializedPair('0x123', '0x456', 1),
        },
        5: {
          '0x123;0x456': buildSerializedPair('0x123', '0x456', 5),
        },
      })
    })
  })
})
