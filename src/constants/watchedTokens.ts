import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { UNI, USDC } from 'src/constants/tokens'

export const DEFAULT_WATCHED_TOKENS = {
  [ChainId.MAINNET]: {
    [NULL_ADDRESS]: true, // Native Eth
    [USDC.address]: true,
    [UNI[ChainId.MAINNET].address]: true,
  },
  [ChainId.GOERLI]: {
    [NULL_ADDRESS]: true, // Native Eth
    [UNI[ChainId.GOERLI].address]: true,
  },
  [ChainId.RINKEBY]: {
    [NULL_ADDRESS]: true, // Native Eth
    [UNI[ChainId.RINKEBY].address]: true,
  },
}
