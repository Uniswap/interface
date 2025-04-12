import { Currency } from '@uniswap/sdk-core'
import { PopupType } from 'components/Popups/types'
import { DEFAULT_TXN_DISMISS_MS } from 'constants/misc'
import { useCallback, useMemo } from 'react'
import {
  ApplicationModal,
  CloseModalParams,
  OpenModalParams,
  addSuppressedPopups,
  removeSuppressedPopups,
  setCloseModal,
  setOpenModal,
  setSmartPoolValue,
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

export function useToggleDelegateModal(): () => void {
  return useToggleModal(ApplicationModal.DELEGATE)
}

export function useToggleCreateModal(): () => void {
  return useToggleModal(ApplicationModal.CREATE)
}

export function useToggleVoteModal(): () => void {
  return useToggleModal(ApplicationModal.VOTE)
}

export function useToggleQueueModal(): () => void {
  return useToggleModal(ApplicationModal.QUEUE)
}

export function useToggleExecuteModal(): () => void {
  return useToggleModal(ApplicationModal.EXECUTE)
}

export function useTogglePrivacyPolicy(): () => void {
  return useToggleModal(ApplicationModal.PRIVACY_POLICY)
}

export function useSelectActiveSmartPool(): (smartPoolValue?: Currency) => void {
  const dispatch = useAppDispatch()
  return useCallback(
    (smartPoolValue?: Currency) => {
      dispatch(
        setSmartPoolValue({
          smartPool: {
            address: smartPoolValue?.isToken ? smartPoolValue.address : undefined,
            name: smartPoolValue?.isToken && smartPoolValue.name ? smartPoolValue.name : undefined,
          },
        })
      )
    },
    [dispatch]
  )
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

export function useActiveSmartPool(): InterfaceState['application']['smartPool'] {
  return useAppSelector((state: InterfaceState) => state.application.smartPool)
}
