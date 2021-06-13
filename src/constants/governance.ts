import { GOVERNANCE_ADDRESSES, TIMELOCK_ADDRESS, UNI_ADDRESS } from './addresses'

export const COMMON_CONTRACT_NAMES: { [chainId: number]: { [address: string]: string } } = {
  [1]: {
    [UNI_ADDRESS[1]]: 'UNI',
    [GOVERNANCE_ADDRESSES[0][1]]: 'Governance (V0)',
    [GOVERNANCE_ADDRESSES[1][1]]: 'Governance',
    [TIMELOCK_ADDRESS[1]]: 'Timelock',
  },
}

export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 13

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId: number]: number } = {
  [1]: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
