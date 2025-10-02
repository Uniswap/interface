import { useMutation } from '@tanstack/react-query'
import { ExternalWallet } from 'features/accounts/store/types'
import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { createContext, useContext, useMemo } from 'react'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useEvent } from 'utilities/src/react/hooks'

export interface ConnectWalletMutationParams {
  connectionService: ConnectionService
  wallet: ExternalWallet
  individualPlatform?: Platform
  onSuccess?: () => void
}

const SINGLETON_CONNECTION_MUTATION_KEY = ['singleton-connection'] as const

function useConnectWalletMutationBase() {
  const query = useMutation({
    mutationKey: SINGLETON_CONNECTION_MUTATION_KEY,
    mutationFn: (params: ConnectWalletMutationParams) => {
      return params.connectionService.connect({ wallet: params.wallet })
    },
    onSuccess: (result, params: ConnectWalletMutationParams) => {
      // Avoid triggering UI Callbacks if connection did not occur, e.g. user rejection.
      if (result.connected) {
        params.onSuccess?.()
      }
    },
  })

  // Override the mutate function to add a check to avoid connecting again if a connection is already in progress.
  const mutate = useEvent(async (params: ConnectWalletMutationParams) => {
    if (query.isPending) {
      return
    }
    query.mutate(params)
  })

  const pendingWallet = query.isPending ? query.variables.wallet : undefined

  return useMemo(
    () => ({ ...query, mutate, isConnecting: query.isPending, pendingWallet }),
    [query, mutate, pendingWallet],
  )
}

type ConnectWalletMutationReturnType = ReturnType<typeof useConnectWalletMutationBase>

const ConnectWalletMutationContext = createContext<ConnectWalletMutationReturnType | undefined>(undefined)

/** Gives the app access to singleton connect wallet mutation. */
export function ConnectWalletMutationProvider({ children }: { children: React.ReactNode }) {
  return (
    <ConnectWalletMutationContext.Provider value={useConnectWalletMutationBase()}>
      {children}
    </ConnectWalletMutationContext.Provider>
  )
}

export function useConnectWalletMutation() {
  const context = useContext(ConnectWalletMutationContext)
  if (!context) {
    throw new Error('useConnectWalletMutation must be used within a ConnectWalletMutationProvider')
  }
  return context
}
