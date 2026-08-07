import { GraphQLApi } from '@universe/api'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { RestContract } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'

// Converts CurrencyId to GraphQLApi.ContractInput format for GQL token queries
export function currencyIdToContractInput(id: CurrencyId): GraphQLApi.ContractInput {
  return {
    chain: toGraphQLChain(currencyIdToChain(id) ?? UniverseChainId.Mainnet),
    address: currencyIdToGraphQLAddress(id) ?? undefined,
  }
}

// Market-data REST endpoints (GetTokenMarkets, GetTokenMarketsMultiChain, GetTokenHistory*) index
// Solana volume/TVL/price under the wrapped SOL mint — native SOL isn't an SPL token and has no
// mint of its own.
export function nativeAddressForRest(chainId: UniverseChainId): string {
  if (chainId === UniverseChainId.Solana) {
    return WRAPPED_SOL_ADDRESS_SOLANA
  }
  const legacyNativeAddress = getNativeAddress(chainId)
  // Most chains use the legacy 0xeee placeholder for their native token, which v2 endpoints index
  // under the zero address instead. Chains like Celo/Polygon have a real, backend-indexed native
  // token contract address — that address must be preserved, not overridden with the zero address.
  return legacyNativeAddress === DEFAULT_NATIVE_ADDRESS_LEGACY ? DEFAULT_NATIVE_ADDRESS : legacyNativeAddress
}

// Converts CurrencyId to GraphQLApi.ContractInput format for Rest token queries
export function currencyIdToRestContractInput(id: CurrencyId): RestContract {
  const chainId = currencyIdToChain(id) ?? UniverseChainId.Mainnet
  return {
    chainId,
    address: currencyIdToGraphQLAddress(id) ?? nativeAddressForRest(chainId),
  }
}
