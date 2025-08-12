import { ContractInput } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { DEFAULT_NATIVE_ADDRESS } from 'uniswap/src/features/chains/evm/rpc'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { RestContract } from 'uniswap/src/features/dataApi/types'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToChain, currencyIdToGraphQLAddress } from 'uniswap/src/utils/currencyId'

// Converts CurrencyId to ContractInput format for GQL token queries
export function currencyIdToContractInput(id: CurrencyId): ContractInput {
  return {
    chain: toGraphQLChain(currencyIdToChain(id) ?? UniverseChainId.Mainnet),
    address: currencyIdToGraphQLAddress(id) ?? undefined,
  }
}

// Converts CurrencyId to ContractInput format for Rest token queries
export function currencyIdToRestContractInput(id: CurrencyId): RestContract {
  return {
    chainId: currencyIdToChain(id) ?? UniverseChainId.Mainnet,
    address: currencyIdToGraphQLAddress(id) ?? DEFAULT_NATIVE_ADDRESS,
  }
}
