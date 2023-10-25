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
