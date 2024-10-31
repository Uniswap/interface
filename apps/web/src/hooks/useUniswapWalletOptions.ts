import { useAccount } from 'hooks/useAccount'
import { CONNECTION_PROVIDER_IDS } from 'uniswap/src/constants/web3'

//
// Checks if the user is connected to the uniswap extension.
//
// This hook returns `true` under the following conditions:
//
// - The user has not connected to a different wallet
//
// @returns {boolean} True if the user is not connected a different wallet; otherwise, false.
//
export function useIsUniExtensionAvailable() {
  const currentConnector = useAccount().connector
  const currentConnectIsNotUniExtension =
    currentConnector && currentConnector.id !== CONNECTION_PROVIDER_IDS.UNISWAP_EXTENSION_RDNS

  return !currentConnectIsNotUniExtension
}
