import { ChainId, Currency } from '@uniswap/sdk-core'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { apolloClient } from 'graphql/data/apollo/client'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import { chainIdToBackendName } from 'graphql/data/util'
import {
  SimpleTokenDocument,
  SimpleTokenQuery,
  Token,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

export async function getCurrency(currencyId: string, chainId: ChainId): Promise<Currency | undefined> {
  const isNative =
    currencyId === NATIVE_CHAIN_ID || currencyId?.toLowerCase() === 'native' || currencyId?.toLowerCase() === 'eth'
  if (isNative) {
    return nativeOnChain(chainId)
  }
  const { data } = await apolloClient.query<SimpleTokenQuery>({
    query: SimpleTokenDocument,
    variables: {
      address: currencyId,
      chain: chainIdToBackendName(chainId),
    },
  })
  return gqlTokenToCurrencyInfo(data?.token as Token)?.currency
}
