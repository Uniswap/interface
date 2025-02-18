import { Currency } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID } from 'constants/tokens'
import { apolloClient } from 'graphql/data/apollo/client'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Token,
  TokenDocument,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isSameAddress } from 'utilities/src/addresses'

export async function getCurrency(currencyId: string, chainId: UniverseChainId): Promise<Currency | undefined> {
  const isNative =
    currencyId === NATIVE_CHAIN_ID || currencyId?.toLowerCase() === 'native' || currencyId?.toLowerCase() === 'eth'
  if (isNative) {
    return nativeOnChain(chainId)
  }
  const commonBase = chainId
    ? COMMON_BASES[chainId]?.find((base) => base.currency.isToken && isSameAddress(base.currency.address, currencyId))
    : undefined
  if (commonBase) {
    return commonBase.currency
  }
  const { data } = await apolloClient.query<TokenQuery>({
    query: TokenDocument,
    variables: {
      address: currencyId,
      chain: toGraphQLChain(chainId),
    },
  })
  return gqlTokenToCurrencyInfo(data?.token as Token)?.currency
}
