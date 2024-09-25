import { createStore, Store } from 'redux'
import { RouterPreference } from 'state/routing/types'
import reducer, {
  addSerializedPair,
  initialState,
  updateHideClosedPositions,
  updateUserDeadline,
  updateUserRouterPreference,
  updateUserSlippageTolerance,
  UserState,
} from 'state/user/reducer'

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

  describe('addSerializedPair', () => {
    it('adds a pair to the uninitialized list', () => {
      store = createStore(reducer, {
        ...initialState,
      })
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        }),
      )
      expect(store.getState().pairs).toEqual({
        1: { '0x123;0x456': buildSerializedPair('0x123', '0x456', 1) },
      })
    })

    it('adds two pair to the initialized list, no duplicates', () => {
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        }),
      )
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        }),
      )
      expect(store.getState().pairs).toEqual({
        1: { '0x123;0x456': buildSerializedPair('0x123', '0x456', 1) },
      })
    })

    it('adds two new pairs to the initialized list, same chain', () => {
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 1),
        }),
      )
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x789', 1),
        }),
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
        }),
      )
      store.dispatch(
        addSerializedPair({
          serializedPair: buildSerializedPair('0x123', '0x456', 5),
        }),
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
