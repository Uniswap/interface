import { useEffect, useReducer, useState } from 'react'
import { DappInfo, DappStoreEvent, dappStore } from 'src/app/features/dapp/store'
import { WalletChainId } from 'uniswap/src/types/chains'
import { Account } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

// exported to be used in tests
export function useDappStateUpdated(): boolean {
  const [state, dispatch] = useReducer((v) => !v, false)
  useEffect(() => {
    const onUpdate = (): void => dispatch()
    dappStore.addListener(DappStoreEvent.DappStateUpdated, onUpdate)
    return () => {
      dappStore.removeListener(DappStoreEvent.DappStateUpdated, onUpdate)
    }
  }, [dispatch])
  return state
}

export function useDappInfo(dappUrl: string | undefined): DappInfo | undefined {
  const [info, setInfo] = useState<DappInfo>()
  const dappStateUpdated = useDappStateUpdated()
  useEffect(() => {
    setInfo(dappStore.getDappInfo(dappUrl))
  }, [dappUrl, dappStateUpdated])
  return info
}

export function useDappLastChainId(dappUrl: string | undefined): WalletChainId | undefined {
  return useDappInfo(dappUrl)?.lastChainId
}

export function useDappConnectedAccounts(dappUrl: string | undefined): Account[] {
  return useDappInfo(dappUrl)?.connectedAccounts || []
}

/**
 * Pairs well with `getDappInfo`, which returns the dapp info for a given dapp URL.
 *
 * @returns all dapp connection URLs (ie state keys) for the active account
 */
export function useAllDappConnectionsForActiveAccount(): string[] {
  const [dappUrls, setDappUrls] = useState<string[]>([])
  const dappStateUpdated = useDappStateUpdated()
  const activeAccount = useActiveAccountAddress()

  useEffect(() => {
    setDappUrls(activeAccount ? dappStore.getConnectedDapps(activeAccount) : [])
  }, [activeAccount, dappStateUpdated])

  return dappUrls
}
