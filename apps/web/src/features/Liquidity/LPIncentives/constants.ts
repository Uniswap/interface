import ms from 'ms'
import { UNI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export const LP_INCENTIVES_CHAIN_ID = UniverseChainId.Mainnet
export const LP_INCENTIVES_CHAIN_IDS = [LP_INCENTIVES_CHAIN_ID]
export const LP_INCENTIVES_REWARD_TOKEN = UNI[LP_INCENTIVES_CHAIN_ID]

// Raw-units threshold (0.001 UNI) below which rewards are treated as dust and the Collect CTA is hidden/disabled.
// Mainnet claim gas typically exceeds the USD value of sub-millicent UNI amounts.
export const LP_INCENTIVES_DUST_THRESHOLD = BigInt(10) ** BigInt(LP_INCENTIVES_REWARD_TOKEN.decimals - 3)

// Window during which a recent `lpIncentivesLastClaimedAtom` entry is treated as "still claimed" — covers the lag
// between an on-chain claim and Merkl's API reflecting the zero balance. Used by the "effectively claimed" check.
export const LP_INCENTIVES_CLAIM_STALENESS_MS = ms('5m')
