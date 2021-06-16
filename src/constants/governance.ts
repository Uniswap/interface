import { GOVERNANCE_ADDRESSES, TIMELOCK_ADDRESS, UNI_ADDRESS } from './addresses'
import { SupportedChainId } from './chains'

// returns { [address]: `Governance (V${n})`} for each address in GOVERNANCE_ADDRESSES except the current, which gets no version indicator
const governanceContracts = (): Record<string, string> =>
  GOVERNANCE_ADDRESSES.reduce(
    (acc, addressMap, i) => ({
      ...acc,
      [addressMap[SupportedChainId.MAINNET]]: `Governance${
        i === 0 ? '' : ` (V${GOVERNANCE_ADDRESSES.length - 1 - i})`
      }`,
    }),
    {}
  )

export const COMMON_CONTRACT_NAMES: Record<number, { [address: string]: string }> = {
  [SupportedChainId.MAINNET]: {
    [UNI_ADDRESS[SupportedChainId.MAINNET]]: 'UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.MAINNET]]: 'Timelock',
    ...governanceContracts(),
  },
}

export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 13

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId: number]: number } = {
  [1]: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
