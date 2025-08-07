import { connect, getConnectors } from '@wagmi/core'
import { wagmiConfig } from 'components/Web3Provider/wagmiConfig'
import { walletTypeToAmplitudeWalletType } from 'components/Web3Provider/walletConnect'
import type {
  WagmiConnectorDetails,
  WagmiWalletConnectorMeta,
} from 'features/wallet/connection/types/WalletConnectorMeta'
import { useMemo } from 'react'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'
import { isPlaywrightEnv } from 'utilities/src/environment/env'
import { sleep } from 'utilities/src/time/timing'
import { useConnectors } from 'wagmi'

export function useWagmiWalletConnectors(): WagmiWalletConnectorMeta[] {
  const connectors = useConnectors()

  return useMemo(() => {
    let isEip6963Supported = false
    return connectors
      .map(({ id, name, icon, type }) => {
        if (
          type === CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE &&
          id !== CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID
        ) {
          isEip6963Supported = true
        }

        return {
          wagmi: { id, type },
          name,
          icon,
          isInjected:
            id === CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID ||
            type === CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_TYPE,
          analyticsWalletType: walletTypeToAmplitudeWalletType(type),
        }
      })
      .filter((connector) => {
        // if we have any eip6963 connectors (type == "injected"), ignore any legacy connectors (type == 'injected' && id === "injected")
        // if EIP-6963 is not supported, include all connectors (legacy injected + all other wallets)
        return isEip6963Supported ? connector.wagmi.id !== CONNECTION_PROVIDER_IDS.INJECTED_CONNECTOR_ID : true
      })
  }, [connectors])
}

export async function connectWagmiWallet({ wagmi }: { wagmi: WagmiConnectorDetails }): Promise<void> {
  const connector = getConnectors(wagmiConfig).find((connector) => connector.id === wagmi.id)

  if (!connector) {
    throw new Error(`Wagmi connector not found for id ${wagmi.id}`)
  }

  // This is a hack to ensure the connection runs in playwright
  // TODO(WEB-4173): Look into removing setTimeout connection.connect({ connector })
  if (isPlaywrightEnv()) {
    await sleep(1)
  }

  await connect(wagmiConfig, { connector })
  return
}
