import { connect, getConnectors } from '@wagmi/core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import { ExternalConnector } from 'features/accounts/store/types'
import { createConnectionService, GetConnectorFn } from 'features/wallet/connection/services/createConnectionService'
import { ConnectionService } from 'features/wallet/connection/services/IConnectionService'
import type { WagmiWalletConnectorMeta } from 'features/wallet/connection/types/WalletConnectorMeta'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { sleep } from 'utilities/src/time/timing'
import { useConnectors } from 'wagmi'

export function useWagmiWalletConnectors(): WagmiWalletConnectorMeta[] {
  const connectors = useConnectors()

  return useMemo(() => {
    return connectors.map(({ id, name, icon, type }) => {
      return {
        wagmi: { id, type },
        name,
        icon,
        isInjected: type === CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE,
        analyticsWalletType: walletTypeToAmplitudeWalletType(type),
      }
    })
  }, [connectors])
}

export async function activateWagmiConnector(connector: ExternalConnector<Platform.EVM>): Promise<void> {
  const wagmiConnector = getConnectors(wagmiConfig).find((c) => c.id === connector.externalLibraryId)

  if (!wagmiConnector) {
    throw new Error(`Wagmi connector not found for id ${connector.id} / ${connector.externalLibraryId}`)
  }

  // This is a hack to ensure the connection runs in playwright
  // TODO(WEB-4173): Look into removing setTimeout connection.connect({ connector })
  if (isPlaywrightEnv()) {
    await sleep(1)
  }

  await connect(wagmiConfig, { connector: wagmiConnector })
  return
}

export function getEVMConnectionService(getConnector: GetConnectorFn): ConnectionService {
  return createConnectionService({ platform: Platform.EVM, getConnector, activateConnector: activateWagmiConnector })
}
