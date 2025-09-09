import { Currency } from '@uniswap/sdk-core'
import { apolloClient } from 'appGraphql/data/apollo/client'
import { gqlTokenToCurrencyInfo } from 'appGraphql/data/types'
import { COMMON_BASES } from 'uniswap/src/constants/routing'
import { nativeOnChain } from 'uniswap/src/constants/tokens'
import {
  Token,
  TokenDocument,
  TokenQuery,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { isSameAddress } from 'utilities/src/addresses'

export async function getCurrencyFromCurrencyId(currencyId: CurrencyId): Promise<Currency | undefined> {
  // Split currencyId and confirm validity
  const chainId = currencyIdToChain(currencyId)
  const address = currencyIdToAddress(currencyId)
  if (!chainId) {
    return undefined
  }

  // Handle native currency
  const isNative = isNativeCurrencyAddress(chainId, address)
  if (isNative) {
    return nativeOnChain(chainId)
  }

  // Handle common bases
  const commonBase = COMMON_BASES[chainId].find(
    (base) => base.currency.isToken && isSameAddress(base.currency.address, address),
  )
  if (commonBase) {
    return commonBase.currency
  }

  // Query for token from graphql
  const { data } = await apolloClient.query<TokenQuery>({
    query: TokenDocument,
    variables: {
      address,
      chain: toGraphQLChain(chainId),
    },
  })
  return gqlTokenToCurrencyInfo(data.token as Token)?.currency
}
