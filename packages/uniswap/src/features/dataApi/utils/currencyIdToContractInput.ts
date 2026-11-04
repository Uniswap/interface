import { UniverseChainId } from '@universe/chains'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { DEFAULT_NATIVE_ADDRESS, DEFAULT_NATIVE_ADDRESS_LEGACY } from 'uniswap/src/features/chains/evm/rpc'
import { WRAPPED_SOL_ADDRESS_SOLANA } from 'uniswap/src/features/chains/svm/defaults'
import { RestContract } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToChain, currencyIdToContractAddress } from 'uniswap/src/utils/currencyId'

export type ChainIdContractInput = { chainId: UniverseChainId; address?: string }

export function currencyIdToContractInput(id: CurrencyId): ChainIdContractInput {
  return {
    chainId: currencyIdToChain(id) ?? UniverseChainId.Mainnet,
    address: currencyIdToContractAddress(id) ?? undefined,
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

// Converts CurrencyId to a chainId-keyed contract for REST token queries
export function currencyIdToRestContractInput(id: CurrencyId): RestContract {
  const chainId = currencyIdToChain(id) ?? UniverseChainId.Mainnet
  return {
    chainId,
    address: currencyIdToContractAddress(id) ?? nativeAddressForRest(chainId),
  }
}
