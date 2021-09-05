import { ChainId, ZERO_ADDRESS } from '@swapr/sdk'

// declared in a different file to avoid importing the constants module
// while setting env variables (would cause inconsistencied)
export const CONVERTER_ADDRESS: { [key: number]: string } = {
  // set in envs
  [ChainId.ARBITRUM_ONE]: ZERO_ADDRESS,
  [ChainId.ARBITRUM_RINKEBY]: ZERO_ADDRESS
}
