import React, { useCallback } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useActiveWeb3React } from '../../hooks'
import { AppDispatch, AppState } from '../index'
import { ApplicationModal, MainnetGasPrice, PopupContent, setOpenModal } from './actions'
import { toast } from 'react-toastify'
import PopupItem from '../../components/Popups/PopupItem'

export function useBlockNumber(): number | undefined {
  const { chainId } = useActiveWeb3React()

  return useSelector((state: AppState) => state.application.blockNumber[chainId ?? -1])
}

export function useMainnetGasPrices(): { [speed in MainnetGasPrice]: string } | null {
  return useSelector((state: AppState) => state.application.mainnetGasPrices)
}

export function useModalOpen(modal: ApplicationModal): boolean {
  const openModal = useSelector((state: AppState) => state.application.openModal)
  return openModal === modal
}

export function useToggleModal(modal: ApplicationModal): () => void {
  const open = useModalOpen(modal)
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(open ? null : modal)), [dispatch, modal, open])
}

export function useOpenModal(modal: ApplicationModal): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(modal)), [dispatch, modal])
}

export function useCloseModals(): () => void {
  const dispatch = useDispatch<AppDispatch>()
  return useCallback(() => dispatch(setOpenModal(null)), [dispatch])
}

export function useWalletModalToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET)
}

export function useToggleSettingsMenu(): () => void {
  return useToggleModal(ApplicationModal.SETTINGS)
}

export function useToggleMobileMenu(): () => void {
  return useToggleModal(ApplicationModal.MOBILE)
}

export function useShowClaimPopup(): boolean {
  return useModalOpen(ApplicationModal.CLAIM_POPUP)
}

export function useToggleShowClaimPopup(): () => void {
  return useToggleModal(ApplicationModal.CLAIM_POPUP)
}

export function useToggleSelfClaimModal(): () => void {
  return useToggleModal(ApplicationModal.SELF_CLAIM)
}

export function useNetworkSwitcherPopoverToggle(): () => void {
  return useToggleModal(ApplicationModal.NETWORK_SWITCHER)
}

export function useWalletSwitcherPopoverToggle(): () => void {
  return useToggleModal(ApplicationModal.WALLET_SWITCHER)
}

export function useEthereumOptionPopoverToggle(): () => void {
  return useToggleModal(ApplicationModal.ETHEREUM_OPTION)
}

export function useAddPopup(): (content: PopupContent, autoClose?: number | false) => void {
  return useCallback((content: PopupContent, autoClose: number | false = 15000) => {
    toast.info(<PopupItem content={content} />, { autoClose })
  }, [])
}
