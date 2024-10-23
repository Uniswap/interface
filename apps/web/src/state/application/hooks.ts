import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback, useMemo } from 'react'
import {
  ApplicationModal,
  CloseModalParams,
  OpenModalParams,
  PopupContent,
  PopupType,
  addPopup,
  addSuppressedPopups,
  removePopup,
  removeSuppressedPopups,
  setCloseModal,
  setOpenModal,
} from 'state/application/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export function useModalIsOpen(modal: ApplicationModal | ModalNameType): boolean {
  const openModal = useAppSelector((state: InterfaceState) => state.application.openModal?.name)
  return openModal === modal
}

// TODO(WEB-4889): Remove this
/** @deprecated - use separate open and close modal hooks for new modals instead */
export function useToggleModal(modal: ApplicationModal): () => void {
  const isOpen = useModalIsOpen(modal)
  const dispatch = useAppDispatch()

  return useCallback(() => {
    if (isOpen) {
      dispatch(setCloseModal(modal))
    } else {
      dispatch(setOpenModal({ name: modal }))
    }
  }, [dispatch, modal, isOpen])
}

export function useCloseModal(modal?: CloseModalParams) {
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setCloseModal(modal)), [dispatch, modal])
}

export function useOpenModal(modal: OpenModalParams): () => void {
  const dispatch = useAppDispatch()
  return useCallback(() => dispatch(setOpenModal(modal)), [dispatch, modal])
}

export function useToggleSettingsMenu(): () => void {
  return useToggleModal(ApplicationModal.SETTINGS)
}

export function useShowClaimPopup(): boolean {
  return useModalIsOpen(ApplicationModal.CLAIM_POPUP)
}

export function useToggleShowClaimPopup(): () => void {
  return useToggleModal(ApplicationModal.CLAIM_POPUP)
}

export function useToggleSelfClaimModal(): () => void {
  return useToggleModal(ApplicationModal.SELF_CLAIM)
}

export function useTogglePrivacyPolicy(): () => void {
  return useToggleModal(ApplicationModal.PRIVACY_POLICY)
}

// returns a function that allows adding a popup
export function useAddPopup(): (content: PopupContent, key?: string, removeAfterMs?: number) => void {
  const dispatch = useAppDispatch()
  return useCallback(
    (content: PopupContent, key?: string, removeAfterMs?: number) => {
      dispatch(addPopup({ content, key, removeAfterMs: removeAfterMs ?? DEFAULT_TXN_DISMISS_MS }))
    },
    [dispatch],
  )
}

// returns a function that allows removing a popup via its key
export function useRemovePopup(): (key: string) => void {
  const dispatch = useAppDispatch()
  return useCallback(
    (key: string) => {
      dispatch(removePopup({ key }))
    },
    [dispatch],
  )
}

// get the list of active popups
export function useActivePopups(): InterfaceState['application']['popupList'] {
  const list = useAppSelector((state: InterfaceState) => state.application.popupList)
  return useMemo(() => list.filter((item) => item.show), [list])
}

// returns functions to suppress and unsuppress popups by type
export function useSuppressPopups(popupTypes: PopupType[]): {
  suppressPopups: () => void
  unsuppressPopups: () => void
} {
  const dispatch = useAppDispatch()
  const suppressPopups = useCallback(() => dispatch(addSuppressedPopups({ popupTypes })), [dispatch, popupTypes])
  const unsuppressPopups = useCallback(() => dispatch(removeSuppressedPopups({ popupTypes })), [dispatch, popupTypes])

  return {
    suppressPopups,
    unsuppressPopups,
  }
}
