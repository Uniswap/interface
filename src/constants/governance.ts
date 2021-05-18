import { ChainId } from '@uniswap/sdk-core'
import { GOVERNANCE_ADDRESS, TIMELOCK_ADDRESS, UNI_ADDRESS } from './addresses'

export const COMMON_CONTRACT_NAMES: { [chainId in ChainId]?: { [address: string]: string } } = {
  [ChainId.MAINNET]: {
    [UNI_ADDRESS[ChainId.MAINNET]]: 'UNI',
    [GOVERNANCE_ADDRESS[ChainId.MAINNET]]: 'Governance',
    [TIMELOCK_ADDRESS[ChainId.MAINNET]]: 'Timelock',
  },
  [ChainId.RINKEBY]: {
    [UNI_ADDRESS[ChainId.RINKEBY]]: 'Rinkeby UNI',
    [GOVERNANCE_ADDRESS[ChainId.RINKEBY]]: 'Rinkeby Governance',
    [TIMELOCK_ADDRESS[ChainId.RINKEBY]]: 'Rinkeby Timelock',
  },
  [ChainId.ROPSTEN]: {
    [UNI_ADDRESS[ChainId.ROPSTEN]]: 'Ropsten UNI',
    [GOVERNANCE_ADDRESS[ChainId.ROPSTEN]]: 'Ropsten Governance',
    [TIMELOCK_ADDRESS[ChainId.ROPSTEN]]: 'Ropsten Timelock',
  },
  [ChainId.KOVAN]: {
    [UNI_ADDRESS[ChainId.KOVAN]]: 'Kovan UNI',
    [GOVERNANCE_ADDRESS[ChainId.KOVAN]]: 'Kovan Governance',
    [TIMELOCK_ADDRESS[ChainId.KOVAN]]: 'Kovan Timelock',
  },
  [ChainId.GÖRLI]: {
    [UNI_ADDRESS[ChainId.GÖRLI]]: 'Goerli UNI',
    [GOVERNANCE_ADDRESS[ChainId.GÖRLI]]: 'Goerli Governance',
    [TIMELOCK_ADDRESS[ChainId.GÖRLI]]: 'Goerli Timelock',
  },
}

export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 13

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId in ChainId]?: number } = {
  [ChainId.MAINNET]: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
