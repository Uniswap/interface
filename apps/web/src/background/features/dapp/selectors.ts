import { WebState } from 'src/background/store'
import { ChainId } from 'wallet/src/constants/chains'

export const selectDappChainId =
  (dappUrl: string) =>
  (state: WebState): ChainId | undefined =>
    state.dapp[dappUrl]?.lastChainId

export const selectDappConnectedAddresses =
  (dappUrl: string) =>
  (state: WebState): Address[] | undefined =>
    state.dapp[dappUrl]?.connectedAddresses

/** Returns connected addresses with the currently connected address listed first. */
export const selectDappOrderedConnectedAddresses = (dappUrl: string) => {
  return (state: WebState): Address[] | undefined => {
    const { connectedAddresses, activeConnectedAddress } = state.dapp[dappUrl] || {}
    if (!connectedAddresses || !activeConnectedAddress) return connectedAddresses

    const filteredConnectedAddresses = connectedAddresses.filter(
      (address) => address !== activeConnectedAddress
    )
    filteredConnectedAddresses.unshift(activeConnectedAddress)
    return filteredConnectedAddresses
  }
}
