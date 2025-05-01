import { useAccount } from 'hooks/useAccount'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

// Checks if the user is connected to the uniswap extension.
//
// @returns {boolean} True if the user is connected to the uniswap extension; otherwise, false.
//
export function useIsUniExtensionConnected() {
  const currentConnector = useAccount().connector

  return currentConnector?.id === CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS
}
