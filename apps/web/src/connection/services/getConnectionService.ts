import { Platform } from '@universe/chains'
import { useMemo } from 'react'
import { useEvent } from 'utilities/src/react/hooks'
import { useAccountsStore } from '~/connection/accounts/hooks'
import type { ExternalConnector, ExternalWallet } from '~/connection/accounts/types'
import { useSolanaConnectionService } from '~/connection/connectors/solana'
import { getEVMConnectionService } from '~/connection/connectors/wagmi'
import { getWalletRequiresSeparatePrompt, useHasAcceptedSolanaConnectionPrompt } from '~/connection/pendingConnection'
import type { ConnectionService } from '~/connection/services/IConnectionService'
import { createMultiPlatformConnectionService } from '~/connection/services/multiplatformConnectionService'

type GetConnectionServiceFn = (params: { wallet: ExternalWallet; individualPlatform?: Platform }) => ConnectionService

export interface ConnectWalletDeps {
  /** Services keyed by wallet id that replace the standard connection flow for that wallet. */
  serviceOverrides?: Partial<Record<string, ConnectionService>>
  /** Called after each platform of a multi-platform connection completes. */
  onCompletedPlatform?: (platform: Platform) => void
}

function useGetConnector() {
  const connectors = useAccountsStore((state) => state.connectors)
  return useEvent(<P extends Platform>(connectorId: string, platform: P): ExternalConnector<P> | undefined => {
    const connector = connectors[connectorId] as ExternalConnector | undefined
    if (connector?.platform !== platform) {
      return undefined
    }
    return connector as ExternalConnector<P>
  })
}

/** Returns a function capable of returning the proper connection service for a given wallet / platform. */
export function useGetConnectionService({
  serviceOverrides,
  onCompletedPlatform,
}: ConnectWalletDeps): GetConnectionServiceFn {
  const getConnector = useGetConnector()
  const svmConnectionService = useSolanaConnectionService(getConnector)
  const evmConnectionService = useMemo(() => getEVMConnectionService(getConnector), [getConnector])
  const getShouldMultiConnect = useGetShouldMultiConnect()
  const onRejectSVMConnection = useOnRejectSVMConnection()

  const multiPlatformService = useMemo(() => {
    return createMultiPlatformConnectionService({
      platformServices: { [Platform.EVM]: evmConnectionService, [Platform.SVM]: svmConnectionService },
      onCompletedPlatform,
      onRejectSVMConnection,
    })
  }, [evmConnectionService, svmConnectionService, onCompletedPlatform, onRejectSVMConnection])

  return useEvent((params) => {
    // For wallets that have non-standard connection behavior
    const overrideService = serviceOverrides?.[params.wallet.id]
    if (overrideService) {
      return overrideService
    }

    // If connection is requested for a specific platform, return the corresponding service
    if (params.individualPlatform) {
      switch (params.individualPlatform) {
        case Platform.EVM:
          return evmConnectionService
        case Platform.SVM:
          return svmConnectionService
      }
    }

    // If multi-connection should not be used, return the EVM service. UI will prompt solana separately.
    if (!getShouldMultiConnect(params)) {
      return evmConnectionService
    }

    return multiPlatformService
  })
}

function useOnRejectSVMConnection() {
  const { setHasAcceptedSolanaConnectionPrompt } = useHasAcceptedSolanaConnectionPrompt()

  return useEvent((walletId: string) => {
    if (getWalletRequiresSeparatePrompt(walletId)) {
      setHasAcceptedSolanaConnectionPrompt(false)
    }
  })
}

function useGetShouldMultiConnect() {
  const { hasAcceptedSolanaConnectionPrompt } = useHasAcceptedSolanaConnectionPrompt()

  return useEvent(
    ({ wallet }: { wallet: ExternalWallet }) =>
      !getWalletRequiresSeparatePrompt(wallet.id) || hasAcceptedSolanaConnectionPrompt,
  )
}
