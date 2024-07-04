import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { addConnectedWallet } from 'state/wallets/reducer'
import { Wallet } from 'state/wallets/types'

export function useConnectedWallets(): [Wallet[], (wallet: Wallet) => void] {
  const dispatch = useAppDispatch()
  const connectedWallets = useAppSelector((state) => state.wallets.connectedWallets)
  const addWallet = useCallback(
    (wallet: Wallet) => {
      dispatch(addConnectedWallet(wallet))
    },
    [dispatch],
  )
  return [connectedWallets, addWallet]
}
