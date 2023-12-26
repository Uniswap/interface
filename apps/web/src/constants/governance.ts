import {
  ChainId,
  GOVERNANCE_ALPHA_V0_ADDRESSES,
  GOVERNANCE_ALPHA_V1_ADDRESSES,
  GOVERNANCE_BRAVO_ADDRESSES,
  TIMELOCK_ADDRESSES,
  UNI_ADDRESSES,
} from '@uniswap/sdk-core'

export const COMMON_CONTRACT_NAMES: Record<number, { [address: string]: string }> = {
  [ChainId.MAINNET]: {
    [UNI_ADDRESSES[ChainId.MAINNET]]: 'UNI',
    [TIMELOCK_ADDRESSES[ChainId.MAINNET]]: 'Timelock',
    [GOVERNANCE_ALPHA_V0_ADDRESSES[ChainId.MAINNET]]: 'Governance (V0)',
    [GOVERNANCE_ALPHA_V1_ADDRESSES[ChainId.MAINNET]]: 'Governance (V1)',
    [GOVERNANCE_BRAVO_ADDRESSES[ChainId.MAINNET]]: 'Governance',
    '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e': 'ENS Registry',
    '0x4976fb03C32e5B8cfe2b6cCB31c09Ba78EBaBa41': 'ENS Public Resolver',
    '0xf754A7E347F81cFdc70AF9FbCCe9Df3D826360FA': 'Franchiser Factory',
  },
}

// in PoS, ethereum block time is 12s, see https://ethereum.org/en/developers/docs/blocks/#block-time
export const DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS = 12

// Block time here is slightly higher (~1s) than average in order to avoid ongoing proposals past the displayed time
export const AVERAGE_BLOCK_TIME_IN_SECS: { [chainId: number]: number } = {
  1: DEFAULT_AVERAGE_BLOCK_TIME_IN_SECS,
}

export const LATEST_GOVERNOR_INDEX = 2
