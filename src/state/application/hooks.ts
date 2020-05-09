import React, { useCallback } from 'react'
import { useWeb3React } from '../../hooks'
import { addPopup, removePopup, toggleWalletModal } from './actions'
import { useSelector, useDispatch } from 'react-redux'
import { State } from '../index'

export function useBlockNumber() {
  const { chainId } = useWeb3React()

  return useSelector((state: State) => state.application.blockNumber[chainId])
}

export function useWalletModalOpen() {
  return useSelector((state: State) => state.application.walletModalOpen)
}

export function useWalletModalToggle() {
  const dispatch = useDispatch()
  return useCallback(() => dispatch(toggleWalletModal()), [dispatch])
}

export function useUserAdvanced() {
  return useSelector((state: State) => state.application.userAdvanced)
}

export function usePopups(): [
  State['application']['popupList'],
  (content: React.ReactElement) => void,
  (key: string) => void
] {
  const dispatch = useDispatch()
  const { activePopups } = useSelector((state: State) => ({
    currentPopups: state.application.popupList.filter(item => item.show)
  }))

  const wrappedAddPopup = useCallback(
    (content: React.ReactElement) => {
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
