import { GraphQLApi } from '@universe/api'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
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

// Converts CurrencyId to GraphQLApi.ContractInput format for Rest token queries
export function currencyIdToRestContractInput(id: CurrencyId): RestContract {
  return {
    chainId: currencyIdToChain(id) ?? UniverseChainId.Mainnet,
    address: currencyIdToGraphQLAddress(id) ?? DEFAULT_NATIVE_ADDRESS,
  }
}
