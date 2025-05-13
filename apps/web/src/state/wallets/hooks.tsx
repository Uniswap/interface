import { useCallback } from 'react'
import { useAppDispatch, useAppSelector } from 'state/hooks'
import { addConnectedWallet, setActiveChainId, updateDelegatedState } from 'state/wallets/reducer'
import { Wallet } from 'state/wallets/types'
import { type UniverseChainId } from 'uniswap/src/features/chains/types'
import { useEvent } from 'utilities/src/react/hooks'

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

export function useUpdateDelegatedState(): (input: { chainId: string; address: string }) => void {
  const dispatch = useAppDispatch()
  return useEvent((input: { chainId: string; address: string }) => {
    dispatch(updateDelegatedState(input))
  })
}

export function useSetActiveChainId(): (chainId?: UniverseChainId) => void {
  const dispatch = useAppDispatch()
  return useEvent((chainId?: UniverseChainId) => {
    dispatch(setActiveChainId({ chainId }))
  })
}
