import ms from 'ms'
import { UNI } from 'uniswap/src/constants/tokens'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

// Where rewards are denominated and claimed — distinct from the chain whose pools earn them.
export const LP_INCENTIVES_CHAIN_ID = UniverseChainId.Mainnet
export const LP_INCENTIVES_CHAIN_IDS = [LP_INCENTIVES_CHAIN_ID]
export const LP_INCENTIVES_REWARD_TOKEN = UNI[LP_INCENTIVES_CHAIN_ID]

// Chain whose pools are eligible for incentives; used to scope "find eligible pools" links.
export const LP_INCENTIVES_POOLS_CHAIN_ID = UniverseChainId.Robinhood

// Raw-units threshold (0.001 UNI) below which rewards are treated as dust and the Collect CTA is hidden/disabled.
// Mainnet claim gas typically exceeds the USD value of sub-millicent UNI amounts.
export const LP_INCENTIVES_DUST_THRESHOLD = BigInt(10) ** BigInt(LP_INCENTIVES_REWARD_TOKEN.decimals - 3)

// USD value below which a per-token reward is treated as dust and hidden from the multi-token
// rewards modal — claim gas typically exceeds the value of a sub-cent reward.
export const LP_INCENTIVES_USD_DUST_THRESHOLD = 0.01

// Window during which a recent claim is treated as "still claimed" — covers the lag between an on-chain
// claim and Merkl's API reflecting the zero balance. Used by the "effectively claimed" check and the
// LP-incentives claimed store.
export const LP_INCENTIVES_CLAIM_STALENESS_MS = ms('5m')
