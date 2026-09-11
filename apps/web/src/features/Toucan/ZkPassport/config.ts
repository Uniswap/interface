import { UniverseChainId } from 'uniswap/src/features/chains/types'

/** Origin serving the ZKPassport verification popup. */
export const ZKPASSPORT_POPUP_URL = (process.env.ZKPASSPORT_POPUP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

/** Chain names in the ZKPassport SDK's format, keyed by supported chain. */
export const ZKPASSPORT_CHAIN_NAME: Partial<Record<UniverseChainId, string>> = {
  [UniverseChainId.Sepolia]: 'ethereum_sepolia',
}

/**
 * ZKPassportCredentials registry per chain. Auction validation hooks whose
 * ERC-1155 matches it gate bids on a ZKPassport credential.
 */
export const ZKPASSPORT_ATTEST_REGISTRY: Partial<Record<UniverseChainId, `0x${string}`>> = {
  [UniverseChainId.Sepolia]: (process.env.ZKPASSPORT_ATTEST_REGISTRY_SEPOLIA ??
    '0x3278117D873965036B5e0007112ADDd488Bde3e1') as `0x${string}`,
}
