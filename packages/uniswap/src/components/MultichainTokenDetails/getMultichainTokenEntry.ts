import type { GraphQLApi } from '@universe/api'
import type { MultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import type { UniverseChainId } from 'uniswap/src/features/chains/types'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

interface MultichainTokenDeployment {
  chain: GraphQLApi.Chain | string | undefined
  address?: string | null
}

/** Converts an allowed GraphQL deployment into the shared multichain entry shape. */
export function getMultichainTokenEntry(
  deployment: MultichainTokenDeployment,
  allowedChainIds: readonly UniverseChainId[],
): MultichainTokenEntry | undefined {
  const chainId = fromGraphQLChain(deployment.chain)
  if (!chainId || !allowedChainIds.includes(chainId)) {
    return undefined
  }

  const rawAddress = deployment.address
  const isNative = !rawAddress || isNativeCurrencyAddress(chainId, rawAddress)

  return {
    chainId,
    address: isNative ? getNativeAddress(chainId) : rawAddress,
    isNative,
  }
}

/** Converts one (chainId, address) entry from a v2 MultichainToken's `addresses` map into the shared multichain entry shape. */
export function getRestMultichainTokenEntry(
  deployment: { chainIdKey: string; address: string },
  allowedChainIds: readonly UniverseChainId[],
): MultichainTokenEntry | undefined {
  const chainIdNumber = Number(deployment.chainIdKey)
  if (!allowedChainIds.includes(chainIdNumber as UniverseChainId)) {
    return undefined
  }
  const chainId = chainIdNumber as UniverseChainId

  const rawAddress = deployment.address
  const isNative = !rawAddress || isNativeCurrencyAddress(chainId, rawAddress)

  return {
    chainId,
    address: isNative ? getNativeAddress(chainId) : rawAddress,
    isNative,
  }
}
