import { ChainId } from '@uniswap/sdk-core'

// Breakpoints specifically for the token pages
// TODO(WEB-2968): Deprecate these in the new .info project
export const MAX_WIDTH_MEDIA_BREAKPOINT = '1200px'
export const XLARGE_MEDIA_BREAKPOINT = '960px'
export const MEDIUM_MEDIA_BREAKPOINT = '720px'
export const SMALL_MEDIA_BREAKPOINT = '540px'
export const MOBILE_MEDIA_BREAKPOINT = '420px'

// includes chains that the backend does not current source off-chain metadata for
export const UNSUPPORTED_METADATA_CHAINS = [ChainId.BNB, ChainId.AVALANCHE]
