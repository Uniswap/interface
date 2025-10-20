import { useEffect, useReducer, useState } from 'react'
import { DappInfo, DappStoreEvent, dappStore } from 'src/app/features/dapp/store'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
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
  }, [])
  return state
}

export function useDappInfo(dappUrl: string | undefined): DappInfo | undefined {
  const [info, setInfo] = useState<DappInfo>()
  const dappStateUpdated = useDappStateUpdated()
  // biome-ignore lint/correctness/useExhaustiveDependencies: dappStateUpdated is used to trigger re-render when dapp store changes
  useEffect(() => {
    setInfo(dappStore.getDappInfo(dappUrl))
  }, [dappUrl, dappStateUpdated])
  return info
}

export function useDappLastChainId(dappUrl: string | undefined): UniverseChainId | undefined {
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

  // biome-ignore lint/correctness/useExhaustiveDependencies: dappStateUpdated is used to trigger re-render when dapp store changes
  useEffect(() => {
    setDappUrls(activeAccount ? dappStore.getConnectedDapps(activeAccount) : [])
  }, [activeAccount, dappStateUpdated])

  return dappUrls
}
