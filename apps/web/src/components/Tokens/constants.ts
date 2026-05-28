// Breakpoints specifically for the token pages

import { UniverseChainId } from 'uniswap/src/features/chains/types'

// TODO(WEB-2968): Deprecate these in the new .info project
export const MAX_WIDTH_MEDIA_BREAKPOINT = '1200px'

// includes chains that the backend does not current source off-chain metadata for
export const UNSUPPORTED_METADATA_CHAINS = [UniverseChainId.Bnb, UniverseChainId.Avalanche]
