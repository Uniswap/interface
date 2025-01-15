import { ApolloCache, NormalizedCacheObject } from '@apollo/client'
import { TokenDocument, TokenQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { currencyIdToContractInput, gqlTokenToCurrencyInfo } from 'uniswap/src/features/dataApi/utils'
import { getOnChainBalancesFetch } from 'uniswap/src/features/portfolio/api'
import { ValueType, getCurrencyAmount } from 'uniswap/src/features/tokens/getCurrencyAmount'
import { CurrencyId } from 'uniswap/src/types/currency'
import { currencyIdToAddress, currencyIdToChain, isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import { logger } from 'utilities/src/logger/logger'

type OnChainMap = Map<
  CurrencyId,
  { currencyAddress: Address; chainId: UniverseChainId; rawBalance?: string; quantity?: number }
>

export async function fetchOnChainBalances({
  apolloCache,
  accountAddress,
  currencyIds,
}: {
  apolloCache: ApolloCache<NormalizedCacheObject>
  accountAddress: Address
  currencyIds: Set<CurrencyId>
}): Promise<OnChainMap> {
  const onchainBalancesByCurrencyId = new Map<
    CurrencyId,
    { currencyAddress: Address; chainId: UniverseChainId; rawBalance?: string; quantity?: number }
  >()

  await Promise.all(
    Array.from(currencyIds).map(async (currencyId): Promise<void> => {
      const currencyAddress = currencyIdToAddress(currencyId)
      const chainId = currencyIdToChain(currencyId)

      if (!currencyAddress || !chainId) {
        logger.error(new Error('Unable to parse `currencyId`'), {
          tags: { file: 'fetchOnChainBalances.ts', function: 'fetchOnChainBalances' },
          extra: { currencyId },
        })
        return
      }

      const { balance: onchainBalance } = await getOnChainBalancesFetch({
        currencyAddress,
        chainId,
        currencyIsNative: isNativeCurrencyAddress(chainId, currencyAddress),
        accountAddress,
      })

      const token = apolloCache.readQuery<TokenQuery>({
        query: TokenDocument,
        variables: currencyIdToContractInput(currencyId),
      })?.token

      if (!token) {
        logger.warn('fetchOnChainBalances.ts', 'fetchOnChainBalances', 'No `token` found', { currencyId })
        return
      }

      const currencyInfo = gqlTokenToCurrencyInfo(token)

      if (!currencyInfo) {
        logger.warn('fetchOnChainBalances.ts', 'fetchOnChainBalances', 'No `currency` found')
        return
      }

      const quantity = getCurrencyAmount({
        value: onchainBalance,
        valueType: ValueType.Raw,
        currency: currencyInfo.currency,
      })?.toExact()

      onchainBalancesByCurrencyId.set(currencyId, {
        currencyAddress,
        chainId,
        rawBalance: onchainBalance,
        quantity: quantity ? parseFloat(quantity) : undefined,
      })
    }),
  )

  return onchainBalancesByCurrencyId
}
