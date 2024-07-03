import { Currency } from '@uniswap/sdk-core'
import { SupportedInterfaceChainId, chainIdToBackendChain } from 'constants/chains'
import { COMMON_BASES } from 'constants/routing'
import { NATIVE_CHAIN_ID, nativeOnChain } from 'constants/tokens'
import { apolloClient } from 'graphql/data/apollo/client'
import { gqlTokenToCurrencyInfo } from 'graphql/data/types'
import {
  SimpleTokenDocument,
  SimpleTokenQuery,
  Token,
} from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { isSameAddress } from 'utilities/src/addresses'

export async function getCurrency(
  currencyId: string,
  chainId: SupportedInterfaceChainId,
): Promise<Currency | undefined> {
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
  const { data } = await apolloClient.query<SimpleTokenQuery>({
    query: SimpleTokenDocument,
    variables: {
      address: currencyId,
      chain: chainIdToBackendChain({ chainId }),
    },
  })
  return gqlTokenToCurrencyInfo(data?.token as Token)?.currency
}
