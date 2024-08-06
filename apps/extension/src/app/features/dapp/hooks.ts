import { useEffect, useReducer, useState } from 'react'
import { DappInfo, DappStoreEvent, dappStore } from 'src/app/features/dapp/store'
import { WalletChainId } from 'uniswap/src/types/chains'
import { Account } from 'wallet/src/features/wallet/accounts/types'

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
