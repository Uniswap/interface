import { PopupType } from 'components/Popups/types'
import { useCallback } from 'react'
import {
  CloseModalParams,
  OpenModalParams,
  addSuppressedPopups,
  removeSuppressedPopups,
  setCloseModal,
  setOpenModal,
} from 'state/application/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { InterfaceState } from 'state/webReducer'
import { ModalName, ModalNameType } from 'uniswap/src/features/telemetry/constants'

export function useModalIsOpen(modal: ModalNameType): boolean {
  const openModal = useAppSelector((state: InterfaceState) => state.application.openModal?.name)
  return openModal === modal
}

// TODO(WEB-4889): Remove this
/** @deprecated - use separate open and close modal hooks for new modals instead */
export function useToggleModal(modal: ModalNameType): () => void {
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
  return useToggleModal(ModalName.Settings)
}

export function useShowClaimPopup(): boolean {
  return useModalIsOpen(ModalName.ClaimPopup)
}

export function useToggleShowClaimPopup(): () => void {
  return useToggleModal(ModalName.ClaimPopup)
}

export function useTogglePrivacyPolicy(): () => void {
  return useToggleModal(ModalName.PrivacyPolicy)
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
