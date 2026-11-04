import { UniverseChainId } from '@universe/chains'
import { normalizeBackendNativeAddress } from 'uniswap/src/data/apiClients/dataApiService/utils/dataApiMultichainToken'
import { toSupportedChainId } from 'uniswap/src/features/chains/utils'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

export interface MultichainTokenDeployment {
  chainId: UniverseChainId
  address: string | null
}

/**
 * Maps GetTokenMultiChain's `addresses` (chainId -> address) to the TDP's per-chain token list,
 * keeping only enabled chains. The endpoint serves natives under placeholder addresses (zero
 * address, 0xeee…, 'ETH'); those become `address: null` so consumers build the native currency id.
 * ERC-20 addresses stay as served (checksummed);
 * `useBalances` retries lookups with a normalized id so they still hit the lowercase balance map.
 */
export function multichainTokensFromAddresses({
  addresses,
  enabledChains,
}: {
  addresses: Record<string, string>
  enabledChains: readonly UniverseChainId[]
}): MultichainTokenDeployment[] {
  const tokens: MultichainTokenDeployment[] = []
  for (const [chainIdKey, deploymentAddress] of Object.entries(addresses)) {
    const chainId = toSupportedChainId(chainIdKey)
    if (!chainId || !enabledChains.includes(chainId)) {
      continue
    }
    const normalizedAddress = normalizeBackendNativeAddress({ chainId, address: deploymentAddress })
    tokens.push({ chainId, address: isNativeCurrencyAddress(chainId, normalizedAddress) ? null : deploymentAddress })
  }
  return tokens
}
