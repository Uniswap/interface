import { QUICK_LAUNCH_DURATION_SECONDS } from '@uniswap/liquidity-launcher-sdk'

/**
 * Placeholder address for a token that is being created and does not have an address yet.
 * Must not be ZERO_ADDRESS (native token). Do not use for API lookups or pool fetches.
 */
export const NEW_TOKEN_PLACEHOLDER_ADDRESS = '0x0000000000000000000000000000000000000001'

/** The quick-launch window in whole hours, for the locked-preset copy ("1 hour", "1-hour auction"). */
export const QUICK_LAUNCH_DURATION_HOURS = QUICK_LAUNCH_DURATION_SECONDS / 3600
