import { Currency } from '@uniswap/sdk-core'
import { SupportedChainId } from 'constants/chains'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { Chain } from 'graphql/data/Token'
import { fromGraphQLChain } from 'graphql/data/util'

export type CurrencyKey = string

export function buildCurrencyKey(chainId: SupportedChainId, address: string): CurrencyKey {
  // We lowercase for compatibility/indexability between gql tokens and sdk currencies
  return `${chainId}-${address.toLowerCase()}`
}

export function currencyKey(currency: Currency): CurrencyKey {
  return buildCurrencyKey(currency.chainId, currency.isToken ? currency.address : NATIVE_CHAIN_ID)
}

export function currencyKeyFromGraphQL(contract: {
  address?: string
  chain: Chain
  standard?: TokenStandard
}): CurrencyKey {
  const chainId = fromGraphQLChain(contract.chain)
  const address = contract.standard === TokenStandard.Native ? NATIVE_CHAIN_ID : contract.address
  if (!address) throw new Error('Non-native token missing address')
  return buildCurrencyKey(chainId, address)
}
