import { configureStore } from '@reduxjs/toolkit'
import { Store } from 'redux'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import reducer, {
  ApplicationState,
  DeletePasskeyModalParams,
  setCloseModal,
  setOpenModal,
  updateChainId,
} from '~/state/application/reducer'
import { AuthenticatorProvider } from '~/types/authenticatorProvider'

describe('application reducer', () => {
  let store: Store<ApplicationState>

  beforeEach(() => {
    store = configureStore({
      reducer,
      preloadedState: {
        chainId: null,
        openModal: null,
        suppressedPopups: [],
      },
    })
  })

  describe('setOpenModal', () => {
    it('should correctly set the open modal', () => {
      store.dispatch(setOpenModal({ name: ModalName.ClaimPopup }))
      expect(store.getState().openModal).toEqual({ name: ModalName.ClaimPopup })
      store.dispatch(setCloseModal())
      expect(store.getState().openModal).toEqual(null)
    })

    it('should set and close DeletePasskey modal with initialState', () => {
      const initialState: DeletePasskeyModalParams['initialState'] = {
        authenticatorId: 'cred-abc',
        authenticatorLabel: 'Chrome',
        authenticatorProvider: AuthenticatorProvider.Google,
        isLastAuthenticator: true,
        lastExportedMs: 1_717_000_000_000,
      }
      store.dispatch(setOpenModal({ name: ModalName.DeletePasskey, initialState }))
      expect(store.getState().openModal).toEqual({ name: ModalName.DeletePasskey, initialState })

      store.dispatch(setCloseModal(ModalName.DeletePasskey))
      expect(store.getState().openModal).toBeNull()
    })
  })

  describe('updateChainId', () => {
    it('updates chain id', () => {
      expect(store.getState().chainId).toEqual(null)

      store.dispatch(updateChainId({ chainId: 1 }))

      expect(store.getState().chainId).toEqual(1)
    })
  })
})
