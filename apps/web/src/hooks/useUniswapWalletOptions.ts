import { CONNECTION } from 'components/Web3Provider/constants'
import { useAccount } from 'hooks/useAccount'

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
  const currentConnectIsNotUniExtension = currentConnector && currentConnector.id !== CONNECTION.UNISWAP_EXTENSION_RDNS

  return !currentConnectIsNotUniExtension
}
