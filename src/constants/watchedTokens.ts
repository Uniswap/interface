import { NULL_ADDRESS } from 'src/constants/accounts'
import { SupportedChainId } from 'src/constants/chains'
import { UNI, USDC } from 'src/constants/tokens'

export const DEFAULT_WATCHED_TOKENS = {
  [SupportedChainId.MAINNET]: {
    [NULL_ADDRESS]: true, // Native Eth
    [USDC.address]: true,
    [UNI[SupportedChainId.MAINNET].address]: true,
  },
  [SupportedChainId.GOERLI]: {
    [NULL_ADDRESS]: true, // Native Eth
    [UNI[SupportedChainId.GOERLI].address]: true,
  },
}
