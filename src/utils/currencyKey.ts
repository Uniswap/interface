import { ChainId, Currency } from '@thinkincoin-libs/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { TokenStandard } from 'graphql/data/__generated__/types-and-hooks'
import { Chain } from 'graphql/data/Token'
import { supportedChainIdFromGQLChain } from 'graphql/data/util'

export type CurrencyKey = string

export function buildCurrencyKey(chainId: ChainId, address: string): CurrencyKey {
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
  const chainId = supportedChainIdFromGQLChain(contract.chain)
  const address = contract.standard === TokenStandard.Native ? NATIVE_CHAIN_ID : contract.address
  if (!address) throw new Error('Non-native token missing address')
  if (!chainId) throw new Error('Unsupported chain from pools query')
  return buildCurrencyKey(chainId, address)
}
