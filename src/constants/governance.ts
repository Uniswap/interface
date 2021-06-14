import { GOVERNANCE_ADDRESSES, TIMELOCK_ADDRESS, UNI_ADDRESS } from './addresses'
import { NETWORK_LABELS, SupportedChainId } from './chains'

// adds "<chain name> Governance" for all governance contract addresses
function governanceAddresses(chainId: SupportedChainId): Record<string, string> {
  return GOVERNANCE_ADDRESSES.reduce(
    (acc, addressMap) => ({
      ...acc,
      [addressMap[chainId]]: `${chainId === SupportedChainId.MAINNET ? '' : NETWORK_LABELS[chainId] + ' '}Governance`,
    }),
    {}
  )
}

export const COMMON_CONTRACT_NAMES: Record<number, { [address: string]: string }> = {
  [SupportedChainId.MAINNET]: {
    [UNI_ADDRESS[SupportedChainId.MAINNET]]: 'UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.MAINNET]]: 'Timelock',
    ...governanceAddresses(SupportedChainId.MAINNET),
  },
  [SupportedChainId.RINKEBY]: {
    [UNI_ADDRESS[SupportedChainId.RINKEBY]]: 'Rinkeby UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.RINKEBY]]: 'Rinkeby Timelock',
    ...governanceAddresses(SupportedChainId.RINKEBY),
  },
  [SupportedChainId.ROPSTEN]: {
    [UNI_ADDRESS[SupportedChainId.ROPSTEN]]: 'Ropsten UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.ROPSTEN]]: 'Ropsten Timelock',
    ...governanceAddresses(SupportedChainId.ROPSTEN),
  },
  [SupportedChainId.KOVAN]: {
    [UNI_ADDRESS[SupportedChainId.KOVAN]]: 'Kovan UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.KOVAN]]: 'Kovan Timelock',
    ...governanceAddresses(SupportedChainId.KOVAN),
  },
  [SupportedChainId.GOERLI]: {
    [UNI_ADDRESS[SupportedChainId.GOERLI]]: 'Goerli UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.GOERLI]]: 'Goerli Timelock',
    ...governanceAddresses(SupportedChainId.GOERLI),
  },
  [SupportedChainId.ARBITRUM_KOVAN]: {
    [UNI_ADDRESS[SupportedChainId.ARBITRUM_KOVAN]]: 'Arbitrum-Kovan UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.ARBITRUM_KOVAN]]: 'Arbitrum-Kovan Timelock',
    ...governanceAddresses(SupportedChainId.ARBITRUM_KOVAN),
  },
  [SupportedChainId.ARBITRUM_ONE]: {
    [UNI_ADDRESS[SupportedChainId.ARBITRUM_ONE]]: 'Arbitrum UNI',
    [TIMELOCK_ADDRESS[SupportedChainId.ARBITRUM_ONE]]: 'Arbitrum Timelock',
    ...governanceAddresses(SupportedChainId.ARBITRUM_ONE),
  },
}

export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 13

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId: number]: number } = {
  [1]: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}
