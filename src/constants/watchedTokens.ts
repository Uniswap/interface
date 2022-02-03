import { NULL_ADDRESS } from 'src/constants/accounts'
import { ChainId } from 'src/constants/chains'
import { UNI, USDC } from 'src/constants/tokens'

export const DEFAULT_WATCHED_TOKENS = {
  [ChainId.Mainnet]: {
    [NULL_ADDRESS]: true, // Native Eth
    [USDC.address]: true,
    [UNI[ChainId.Mainnet].address]: true,
  },
  [ChainId.Goerli]: {
    [NULL_ADDRESS]: true, // Native Eth
    [UNI[ChainId.Goerli].address]: true,
  },
  [ChainId.Rinkeby]: {
    [NULL_ADDRESS]: true, // Native Eth
    [UNI[ChainId.Rinkeby].address]: true,
  },
}
