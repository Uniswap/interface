import { useCallback, useMemo } from 'react'
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

// returns a function that allows adding a popup
export function useAddPopup(): (content: PopupContent) => void {
  const dispatch = useDispatch()

  return useCallback(
    (content: PopupContent) => {
      dispatch(addPopup({ content }))
    },
    [dispatch]
  )
}

// returns a function that allows removing a popup via its key
export function useRemovePopup(): (key: string) => void {
  const dispatch = useDispatch()
  return useCallback(
    (key: string) => {
      dispatch(removePopup({ key }))
    },
    [dispatch]
  )
}

// get the list of active popups
export function useActivePopups(): AppState['application']['popupList'] {
  const list = useSelector((state: AppState) => state.application.popupList)
  return useMemo(() => list.filter(item => item.show), [list])
}
