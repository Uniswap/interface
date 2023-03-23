import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import {
  TokenSpotPriceDocument,
  TokenSpotPriceQuery,
  TokenSpotPriceQueryVariables,
} from 'graphql/data/__generated__/types-and-hooks'
import { apolloClient } from 'graphql/data/apollo'
import { CHAIN_ID_TO_BACKEND_NAME, chainIdToBackendName } from 'graphql/data/util'
import { getNativeTokenDBAddress } from 'utils/nativeTokens'

export async function fetchUSDPrice(
  currencyAmount: CurrencyAmount<Currency> | undefined | null
): Promise<number | undefined> {
  if (!currencyAmount) {
    return undefined
  }
  const isNative = currencyAmount?.currency.isNative
  const data = await apolloClient.query<TokenSpotPriceQuery>({
    query: TokenSpotPriceDocument,
    variables: {
      address: isNative
        ? getNativeTokenDBAddress(CHAIN_ID_TO_BACKEND_NAME[currencyAmount.currency.chainId])
        : currencyAmount?.currency.address ?? '',
      chain: chainIdToBackendName(currencyAmount?.currency.chainId),
    } as TokenSpotPriceQueryVariables,
  })
  return data?.data?.token?.project?.markets?.[0]?.price?.value
}
