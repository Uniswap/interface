import { useAccountDrawer } from 'components/AccountDrawer/MiniPortfolio/hooks'
import {
  getWalletRequiresSeparatePrompt,
  useHasAcceptedSolanaConnectionPrompt,
} from 'components/WalletModal/PendingWalletConnectionModal/state'
import { useAccountsStore } from 'features/accounts/store/hooks'
import type { ExternalConnector, ExternalWallet } from 'features/accounts/store/types'
import {
  useUniswapEmbeddedConnectionService,
  useUniswapMobileConnectionService,
} from 'features/wallet/connection/connectors/custom'
import { useSolanaConnectionService } from 'features/wallet/connection/connectors/solana'
import { getEVMConnectionService } from 'features/wallet/connection/connectors/wagmi'
import type { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import { createMultiPlatformConnectionService } from 'features/wallet/connection/services/multiplatformConnectionService'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { useEvent } from 'utilities/src/react/hooks'

type GetConnectionServiceFn = (params: { wallet: ExternalWallet; individualPlatform?: Platform }) => ConnectionService

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
export function useGetConnectionService(): GetConnectionServiceFn {
  const accountDrawer = useAccountDrawer()
  const getConnector = useGetConnector()
  const svmConnectionService = useSolanaConnectionService(getConnector)
  const evmConnectionService = useMemo(() => getEVMConnectionService(getConnector), [getConnector])
  const getShouldMultiConnect = useGetShouldMultiConnect()
  const onRejectSVMConnection = useOnRejectSVMConnection()

  const multiPlatformService = useMemo(() => {
    return createMultiPlatformConnectionService({
      platformServices: { [Platform.EVM]: evmConnectionService, [Platform.SVM]: svmConnectionService },
      onCompletedPlatform: accountDrawer.close,
      onRejectSVMConnection,
    })
  }, [evmConnectionService, svmConnectionService, accountDrawer.close, onRejectSVMConnection])

  const uniswapEmbeddedService = useUniswapEmbeddedConnectionService()
  const uniswapMobileService = useUniswapMobileConnectionService()

  const overrides: Partial<Record<string, ConnectionService>> = useMemo(() => {
    return {
      [CONNECTION_PROVIDER_IDS.EMBEDDED_WALLET_CONNECTOR_ID]: uniswapEmbeddedService,
      [CONNECTION_PROVIDER_IDS.UNISWAP_WALLET_CONNECT_CONNECTOR_ID]: uniswapMobileService,
    }
  }, [uniswapEmbeddedService, uniswapMobileService])

  return useEvent((params) => {
    // For wallets that have non-standard connection behavior
    const overrideService = overrides[params.wallet.id]
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
