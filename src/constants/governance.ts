import { GOVERNANCE_ADDRESS, TIMELOCK_ADDRESS, UNI_ADDRESS } from './addresses'

export const COMMON_CONTRACT_NAMES: { [chainId: number]: { [address: string]: string } } = {
  [1]: {
    [UNI_ADDRESS[1]]: 'UNI',
    [GOVERNANCE_ADDRESS[1]]: 'Governance',
    [TIMELOCK_ADDRESS[1]]: 'Timelock',
  },
  [4]: {
    [UNI_ADDRESS[4]]: 'Rinkeby UNI',
    [GOVERNANCE_ADDRESS[4]]: 'Rinkeby Governance',
    [TIMELOCK_ADDRESS[4]]: 'Rinkeby Timelock',
  },
  [3]: {
    [UNI_ADDRESS[3]]: 'Ropsten UNI',
    [GOVERNANCE_ADDRESS[3]]: 'Ropsten Governance',
    [TIMELOCK_ADDRESS[3]]: 'Ropsten Timelock',
  },
  [42]: {
    [UNI_ADDRESS[42]]: 'Kovan UNI',
    [GOVERNANCE_ADDRESS[42]]: 'Kovan Governance',
    [TIMELOCK_ADDRESS[42]]: 'Kovan Timelock',
  },
  [5]: {
    [UNI_ADDRESS[5]]: 'Goerli UNI',
    [GOVERNANCE_ADDRESS[5]]: 'Goerli Governance',
    [TIMELOCK_ADDRESS[5]]: 'Goerli Timelock',
  },
}

export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 13

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId: number]: number } = {
  [1]: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
