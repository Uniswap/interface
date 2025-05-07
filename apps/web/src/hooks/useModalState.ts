import { useCallback, useMemo } from 'react'
import { setCloseModal, setOpenModal } from 'state/application/reducer'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { ModalNameType } from 'uniswap/src/features/telemetry/constants'

export type ModalState = {
  isOpen: boolean
  openModal: () => void
  closeModal: () => void
  onClose: () => void
  toggleModal: () => void
}

export function useModalState(modalName: ModalNameType): ModalState {
  const dispatch = useAppDispatch()
  const isOpen = useAppSelector((state) => state.application.openModal?.name === modalName)

  const openModal = useCallback(() => {
    dispatch(setOpenModal({ name: modalName }))
  }, [dispatch, modalName])

  const closeModal = useCallback(() => {
    dispatch(setCloseModal(modalName))
  }, [dispatch, modalName])

  const toggleModal = useCallback(() => {
    if (isOpen) {
      closeModal()
    } else {
      openModal()
    }
  }, [isOpen, openModal, closeModal])

  const modalState = useMemo(
    () => ({
      isOpen,
      openModal,
      closeModal,
      onClose: closeModal,
      toggleModal,
    }),
    [isOpen, openModal, closeModal, toggleModal],
  )

  return modalState
}
