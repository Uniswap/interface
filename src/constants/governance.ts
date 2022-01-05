import { ChainId } from 'constants/chains'
import { GOVERNANCE_ADDRESS, TIMELOCK_ADDRESS, UNI_ADDRESS } from './addresses'

export const COMMON_CONTRACT_NAMES: { [chainId in ChainId]?: { [address: string]: string } } = {
  [ChainId.MAINNET]: {
    [UNI_ADDRESS[ChainId.MAINNET]]: 'UNI',
    [GOVERNANCE_ADDRESS[ChainId.MAINNET]]: 'Governance',
    [TIMELOCK_ADDRESS[ChainId.MAINNET]]: 'Timelock',
  },
  [ChainId.TESTNET]: {
    [UNI_ADDRESS[ChainId.TESTNET]]: 'Rinkeby UNI',
    [GOVERNANCE_ADDRESS[ChainId.TESTNET]]: 'Rinkeby Governance',
    [TIMELOCK_ADDRESS[ChainId.TESTNET]]: 'Rinkeby Timelock',
  },
}

export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 13

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId in ChainId]?: number } = {
  [ChainId.MAINNET]: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
