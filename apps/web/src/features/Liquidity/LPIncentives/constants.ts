import ms from 'ms'

// USD value below which a per-token reward is treated as dust and hidden from the multi-token
// rewards modal — claim gas typically exceeds the value of a sub-cent reward.
export const LP_INCENTIVES_USD_DUST_THRESHOLD = 0.01

// Window during which a recent claim is treated as "still claimed" — covers the lag between an on-chain
// claim and Merkl's API reflecting the zero balance. Used by the "effectively claimed" check and the
// LP-incentives claimed store.
export const LP_INCENTIVES_CLAIM_STALENESS_MS = ms('5m')
