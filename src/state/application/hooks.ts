import { useCallback } from 'react'
import { useWeb3React } from '../../hooks'
import { addPopup, PopupContent, removePopup, toggleWalletModal } from './actions'
import { useSelector, useDispatch } from 'react-redux'
import { AppState } from '../index'

export function useBlockNumber() {
  const { chainId } = useWeb3React()

  return useSelector((state: AppState) => state.application.blockNumber[chainId])
}

export function useWalletModalOpen() {
  return useSelector((state: AppState) => state.application.walletModalOpen)
}

export function useWalletModalToggle() {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleWalletModal()), [dispatch])
}

export function useUserAdvanced() {
  return useSelector((state: AppState) => state.application.userAdvanced)
}

export function usePopups(): [
  AppState['application']['popupList'],
  (content: PopupContent) => void,
  (key: string) => void
] {
  const dispatch = useDispatch()
  const activePopups = useSelector((state: AppState) => state.application.popupList.filter(item => item.show))

  const wrappedAddPopup = useCallback(
    (content: PopupContent) => {
      dispatch(addPopup({ content }))
    },
    [dispatch]
  )

  const wrappedRemovePopup = useCallback(
    (key: string) => {
      dispatch(removePopup({ key }))
    },
    [dispatch]
  )

  return [activePopups, wrappedAddPopup, wrappedRemovePopup]
}
