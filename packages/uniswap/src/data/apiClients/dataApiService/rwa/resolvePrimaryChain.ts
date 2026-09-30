import { chainIdToPlatform, getValidAddress, Platform, type UniverseChainId } from '@universe/chains'
import { pickDisplayChainToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/pickPrimaryChainToken'
import type { ChainToken, IssuerToken } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { logger } from 'utilities/src/logger/logger'

export type ResolvedPrimaryChain = {
  chainToken: ChainToken
  chainId: UniverseChainId
}

// `getValidAddress` without a checksum only checks prefix + length, and with one it rejects mixed-case addresses
// that aren't EIP-55, so check EVM hex content directly.
const EVM_HEX_ADDRESS_REGEX = /^0x[0-9a-fA-F]{40}$/

function isWellFormedTokenAddress({ address, chainId }: { address: string; chainId: UniverseChainId }): boolean {
  if (chainIdToPlatform(chainId) === Platform.EVM) {
    return EVM_HEX_ADDRESS_REGEX.test(address)
  }
  return Boolean(getValidAddress({ address, chainId }))
}

/** Every RWA surface that links to a TDP resolves through here, so a malformed BE address is dropped once for all
 *  of them instead of linking to a TDP that redirects straight to the not-found modal. */
export function resolvePrimaryChain({
  issuer,
  enabledChainIds,
  chainFilter,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
  chainFilter?: UniverseChainId
}): ResolvedPrimaryChain | undefined {
  const chainToken = pickDisplayChainToken({ chainTokens: issuer.chainTokens, enabledChainIds, chainFilter })
  const chainId = chainToken && toSupportedChainId(chainToken.chainId)
  if (!chainToken || !chainId) {
    return undefined
  }
  if (!isWellFormedTokenAddress({ address: chainToken.address, chainId })) {
    logger.warn('resolvePrimaryChain', 'resolvePrimaryChain', 'Dropping RWA deployment with malformed token address', {
      issuer: issuer.issuer,
      symbol: issuer.symbol,
      chainId,
      address: chainToken.address,
    })
    return undefined
  }
  return { chainToken, chainId }
}
