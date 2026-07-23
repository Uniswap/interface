import { pickPrimaryChainToken } from 'uniswap/src/data/rest/rwa/pickPrimaryChainToken'
import type { ChainToken, IssuerToken } from 'uniswap/src/data/rest/rwa/types'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'

export type ResolvedPrimaryChain = {
  chainToken: ChainToken
  chainId: UniverseChainId
}

export function resolvePrimaryChain({
  issuer,
  enabledChainIds,
}: {
  issuer: IssuerToken
  enabledChainIds: readonly UniverseChainId[]
}): ResolvedPrimaryChain | undefined {
  const chainToken = pickPrimaryChainToken(issuer.chainTokens, enabledChainIds)
  const chainId = chainToken && toSupportedChainId(chainToken.chainId)
  return chainToken && chainId ? { chainToken, chainId } : undefined
}
