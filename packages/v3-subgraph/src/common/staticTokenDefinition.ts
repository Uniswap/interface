import { Address } from '@graphprotocol/graph-ts'

import { STATIC_TOKEN_DEFINITIONS, TokenDefinition } from './chain'

// Helper for hardcoded tokens
export const getStaticDefinition = (tokenAddress: Address): TokenDefinition | null => {
  const staticDefinitions = STATIC_TOKEN_DEFINITIONS
  const tokenAddressHex = tokenAddress.toHexString()

  // Search the definition using the address
  for (let i = 0; i < staticDefinitions.length; i++) {
    const staticDefinition = staticDefinitions[i]
    if (staticDefinition.address.toHexString().toLowerCase() == tokenAddressHex.toLowerCase()) {
      return staticDefinition
    }
  }

  // If not found, return null
  return null
}
