import React from 'react'
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
  return () => dispatch(toggleWalletModal())
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
  const { currentPopups } = useSelector((state: State) => ({
    currentPopups: state.application.popupList
  }))

  function wrappedAddPopup(content: React.ReactElement): void {
    dispatch(addPopup({ content }))
  }

  function wrappedRemovePopup(key: string): void {
    dispatch(removePopup({ key }))
  }

  const activePopups = currentPopups.filter(item => {
    return item.show
  })

  return [activePopups, wrappedAddPopup, wrappedRemovePopup]
}
